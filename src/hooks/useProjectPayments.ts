import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useProjectPayments(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["payments", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, suppliers(name), budget_quotes(supplier_name, scope_items(discipline))")
        .eq("project_id", projectId!)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: {
      value: number;
      description?: string;
      supplier_id?: string;
      budget_quote_id?: string;
      due_date?: string;
      paid_date?: string;
      status?: "pendente" | "notificado" | "pago" | "atrasado";
      installment_number?: number;
      total_installments?: number;
      pix_key?: string;
    }) => {
      const { error } = await supabase.from("payments").insert({
        ...item,
        status: item.status ?? "pendente",
        project_id: projectId!,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
      toast({ title: "Pagamento adicionado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("payments").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
      toast({ title: "Pagamento atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
      toast({ title: "Pagamento removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
