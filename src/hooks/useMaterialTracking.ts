import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface MaterialTrackingItem {
  material_name: string;
  quantity_needed?: number;
  quantity_purchased?: number;
  quantity_delivered?: number;
  quantity_used?: number;
  purchase_date?: string;
  delivery_date?: string;
  notes?: string;
  discipline?: string;
  unit?: string;
  supplier_name?: string;
  product_link?: string;
  source?: string;
  budget_quote_id?: string;
}

export function useMaterialTracking(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["material_tracking", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_tracking")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: MaterialTrackingItem) => {
      const { error } = await supabase.from("material_tracking").insert({
        ...item,
        project_id: projectId!,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material_tracking", projectId] });
      toast({ title: "Material adicionado ao rastreamento" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("material_tracking").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material_tracking", projectId] });
      toast({ title: "Rastreamento atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("material_tracking").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material_tracking", projectId] });
      toast({ title: "Material removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const importFromBudget = useMutation({
    mutationFn: async () => {
      const { data: quotes, error: qErr } = await supabase
        .from("budget_quotes")
        .select("*, scope_items(discipline)")
        .eq("project_id", projectId!)
        .eq("status", "aprovado");
      if (qErr) throw qErr;
      if (!quotes || quotes.length === 0) throw new Error("Nenhum orçamento aprovado encontrado");

      const existingIds = (query.data ?? [])
        .map((m) => (m as Record<string, unknown>).budget_quote_id)
        .filter(Boolean);

      const newItems = quotes
        .filter((q) => !existingIds.includes(q.id))
        .filter((q) => (q.material_estimate ?? 0) > 0);

      if (newItems.length === 0) throw new Error("Todos os itens do orçamento já foram importados");

      const inserts = newItems.map((q) => ({
        project_id: projectId!,
        user_id: user!.id,
        material_name: ((q.scope_items as any)?.discipline || q.supplier_name || "Material") + " (orçamento)",
        quantity_needed: q.material_estimate ?? 0,
        discipline: (q.scope_items as any)?.discipline || null,
        supplier_name: q.supplier_name || null,
        source: "orcamento",
        budget_quote_id: q.id,
      }));

      const { error } = await supabase.from("material_tracking").insert(inserts);
      if (error) throw error;
      return inserts.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["material_tracking", projectId] });
      toast({ title: `${count} materiais importados do orçamento` });
    },
    onError: (e: Error) => toast({ title: "Importação", description: e.message, variant: "destructive" }),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, create, update, remove, importFromBudget };
}
