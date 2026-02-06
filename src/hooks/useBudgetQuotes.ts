import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useBudgetQuotes(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["budget_quotes", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_quotes")
        .select("*, scope_items(discipline), suppliers(name)")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: {
      scope_item_id?: string | null;
      supplier_id?: string | null;
      supplier_name?: string | null;
      services_description?: string | null;
      value?: number | null;
      material_estimate?: number | null;
      delivery_time?: string | null;
      payment_terms?: string | null;
      status?: "pendente" | "cotado" | "aprovado" | "rejeitado";
      revision?: string;
      revision_number?: number;
      is_current_revision?: boolean;
    }) => {
      const { error } = await supabase.from("budget_quotes").insert({
        scope_item_id: item.scope_item_id ?? null,
        supplier_id: item.supplier_id ?? null,
        supplier_name: item.supplier_name ?? null,
        services_description: item.services_description ?? null,
        value: item.value ?? null,
        material_estimate: item.material_estimate ?? null,
        delivery_time: item.delivery_time ?? null,
        payment_terms: item.payment_terms ?? null,
        status: item.status ?? "pendente",
        revision: item.revision ?? "Rev 1",
        revision_number: item.revision_number ?? 1,
        is_current_revision: item.is_current_revision ?? true,
        project_id: projectId!,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] });
      toast({ title: "Cotação adicionada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("budget_quotes").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] });
      toast({ title: "Cotação atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] });
      toast({ title: "Cotação removida" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const createRevision = useMutation({
    mutationFn: async (currentRevision: number) => {
      // Mark all current quotes as not current
      const { error: updateError } = await supabase
        .from("budget_quotes")
        .update({ is_current_revision: false })
        .eq("project_id", projectId!)
        .eq("is_current_revision", true);
      if (updateError) throw updateError;

      // Get current quotes to duplicate
      const { data: currentQuotes, error: fetchError } = await supabase
        .from("budget_quotes")
        .select("*")
        .eq("project_id", projectId!)
        .eq("revision_number", currentRevision);
      if (fetchError) throw fetchError;

      if (currentQuotes && currentQuotes.length > 0) {
        const newRevNumber = currentRevision + 1;
        const newQuotes = currentQuotes.map(({ id, created_at, updated_at, ...q }) => ({
          ...q,
          revision: `Rev ${newRevNumber}`,
          revision_number: newRevNumber,
          is_current_revision: true,
        }));
        for (const nq of newQuotes) {
          const { error: insertError } = await supabase.from("budget_quotes").insert(nq);
          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] });
      toast({ title: "Nova revisão criada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { quotes: query.data ?? [], isLoading: query.isLoading, create, update, remove, createRevision };
}
