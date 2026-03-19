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

      // Auto-create budget_quote linked to this scope item
      if (data) {
        try {
          await supabase.from("budget_quotes").insert({
            project_id: projectId!,
            user_id: user!.id,
            scope_item_id: data.id,
            services_description: `${data.discipline}${data.description ? ' - ' + data.description : ''}`,
            status: "pendente",
          });
          queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] });
        } catch (_) { /* silent — budget can be created manually */ }
      }
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ScopeItem>) => {
      const { error } = await supabase.from("scope_items").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scope_items", projectId] });
      toast({ title: "Disciplina atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scope_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scope_items", projectId] });
      toast({ title: "Disciplina removida" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
