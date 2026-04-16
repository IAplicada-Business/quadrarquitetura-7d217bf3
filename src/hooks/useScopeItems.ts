import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ScopeItem {
  id: string;
  discipline: string;
  description: string | null;
  suppliers_to_quote: string | null;
  payment_terms: string | null;
  entry_order: number | null;
  service_duration: string | null;
  parent_id: string | null;
  estimated_value: number | null;
  scope_type: string | null;
  activities: string | null;
  status: string | null;
}

export function useScopeItems(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["scope_items", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scope_items")
        .select("*")
        .eq("project_id", projectId!)
        .order("entry_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ScopeItem[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: Partial<ScopeItem>) => {
      const { data, error } = await supabase.from("scope_items").insert({
        ...item,
        project_id: projectId!,
        user_id: user!.id,
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["scope_items", projectId] });
      toast({ title: "Disciplina adicionada" });

      // Auto-create budget_quote for "contratado" scope_type with eligible status
      const BUDGET_ELIGIBLE_STATUSES = ["contratado", "em_execucao", "executado"];
      const shouldAutoCreate = data
        && data.scope_type === "contratado"
        && BUDGET_ELIGIBLE_STATUSES.includes(data.status ?? "");
      if (shouldAutoCreate) {
        // 1. Auto-create budget_quote with all available scope data
        try {
          await supabase.from("budget_quotes").insert({
            project_id: projectId!,
            user_id: user!.id,
            scope_item_id: data.id,
            services_description: `${data.discipline}${data.description ? ' - ' + data.description : ''}`,
            value: data.estimated_value ?? null,
            material_estimate: data.estimated_value ? Math.round(data.estimated_value * 0.4) : null,
            supplier_name: data.suppliers_to_quote || null,
            payment_terms: data.payment_terms || null,
            status: data.estimated_value ? "cotado" : "pendente",
          });
          queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] });
        } catch (_) { /* silent — budget can be created manually */ }

        // 2. Auto-create schedule_task linked to this scope item
        try {
          // Parse service_duration to estimate days (e.g. "15 dias", "2 semanas")
          let estimatedDays: number | null = null;
          const dur = data.service_duration || "";
          const daysMatch = dur.match(/(\d+)\s*dia/i);
          const weeksMatch = dur.match(/(\d+)\s*semana/i);
          const monthsMatch = dur.match(/(\d+)\s*m[eê]s/i);
          if (daysMatch) estimatedDays = parseInt(daysMatch[1], 10);
          else if (weeksMatch) estimatedDays = parseInt(weeksMatch[1], 10) * 7;
          else if (monthsMatch) estimatedDays = parseInt(monthsMatch[1], 10) * 30;

          await supabase.from("schedule_tasks").insert({
            project_id: projectId!,
            user_id: user!.id,
            task_name: data.discipline,
            scope_item_id: data.id,
            discipline: data.discipline,
            status: "planejado",
            is_client_visible: true,
            order_index: data.entry_order ?? 0,
            estimated_days: estimatedDays,
            supplier_name: data.suppliers_to_quote || null,
          });
          queryClient.invalidateQueries({ queryKey: ["schedule_tasks", projectId] });
        } catch (_) { /* silent — schedule can be created manually */ }
      }
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ScopeItem>) => {
      const { error } = await supabase.from("scope_items").update(updates as any).eq("id", id);
      if (error) throw error;
      // Return merged data for onSuccess
      const { data } = await supabase.from("scope_items").select("*").eq("id", id).single();
      return data as ScopeItem & { id: string };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["scope_items", projectId] });
      toast({ title: "Disciplina atualizada" });

      // When scope becomes "contratado", auto-create budget + schedule if missing
      if (data && data.scope_type === "contratado" && ["contratado", "em_execucao", "executado"].includes(data.status ?? "")) {
        // Check if budget_quote already exists
        const { data: existingBudget } = await supabase
          .from("budget_quotes").select("id").eq("scope_item_id", data.id).limit(1);
        if (!existingBudget || existingBudget.length === 0) {
          try {
            await supabase.from("budget_quotes").insert({
              project_id: projectId!,
              user_id: user!.id,
              scope_item_id: data.id,
              services_description: `${data.discipline}${data.description ? ' - ' + data.description : ''}`,
              value: data.estimated_value ?? null,
              material_estimate: data.estimated_value ? Math.round(data.estimated_value * 0.4) : null,
              supplier_name: data.suppliers_to_quote || null,
              payment_terms: data.payment_terms || null,
              status: data.estimated_value ? "cotado" : "pendente",
            });
            queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] });
          } catch (_) { /* silent */ }
        } else if (data.estimated_value) {
          // Update existing budget with new scope values
          try {
            await supabase.from("budget_quotes").update({
              value: data.estimated_value,
              material_estimate: Math.round(data.estimated_value * 0.4),
              supplier_name: data.suppliers_to_quote || null,
              payment_terms: data.payment_terms || null,
              services_description: `${data.discipline}${data.description ? ' - ' + data.description : ''}`,
            }).eq("scope_item_id", data.id);
            queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] });
          } catch (_) { /* silent */ }
        }

        // Check if schedule_task already exists
        const { data: existingTask } = await supabase
          .from("schedule_tasks").select("id").eq("scope_item_id", data.id).limit(1);
        if (!existingTask || existingTask.length === 0) {
          try {
            let estimatedDays: number | null = null;
            const dur = data.service_duration || "";
            const daysMatch = dur.match(/(\d+)\s*dia/i);
            const weeksMatch = dur.match(/(\d+)\s*semana/i);
            const monthsMatch = dur.match(/(\d+)\s*m[eê]s/i);
            if (daysMatch) estimatedDays = parseInt(daysMatch[1], 10);
            else if (weeksMatch) estimatedDays = parseInt(weeksMatch[1], 10) * 7;
            else if (monthsMatch) estimatedDays = parseInt(monthsMatch[1], 10) * 30;

            await supabase.from("schedule_tasks").insert({
              project_id: projectId!,
              user_id: user!.id,
              task_name: data.discipline,
              scope_item_id: data.id,
              discipline: data.discipline,
              status: "planejado",
              is_client_visible: true,
              order_index: data.entry_order ?? 0,
              estimated_days: estimatedDays,
              supplier_name: data.suppliers_to_quote || null,
            });
            queryClient.invalidateQueries({ queryKey: ["schedule_tasks", projectId] });
          } catch (_) { /* silent */ }
        }
      }
    },
    onError: (e: any) => {
      const msg = e?.message || "";
      if (msg.includes("Status não pode ser revertido")) {
        toast({ title: "Ação bloqueada", description: "Este item já foi contratado e não pode ter o status revertido.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: msg, variant: "destructive" });
      }
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scope_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scope_items", projectId] });
      queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["material_tracking", projectId] });
      queryClient.invalidateQueries({ queryKey: ["schedule_tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["discipline_priorities", projectId] });
      queryClient.invalidateQueries({ queryKey: ["discipline_material_estimates", projectId] });
      toast({ title: "Disciplina removida" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
