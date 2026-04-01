import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { addDays } from "date-fns";

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

  const createInstallments = useMutation({
    mutationFn: async (params: {
      description?: string;
      totalValue: number;
      numParcelas: number;
      firstDate: string;
      intervalDays: number;
      supplier_id?: string;
      budget_quote_id?: string;
      pix_key?: string;
      status?: "pendente" | "notificado" | "pago" | "atrasado";
    }) => {
      const { description, totalValue, numParcelas, firstDate, intervalDays, supplier_id, budget_quote_id, pix_key, status } = params;
      const baseValue = Math.floor((totalValue / numParcelas) * 100) / 100;
      const lastValue = Math.round((totalValue - baseValue * (numParcelas - 1)) * 100) / 100;

      // Insert first payment
      const firstPayload = {
        value: numParcelas === 1 ? totalValue : baseValue,
        description: numParcelas > 1 ? `${description || "Pagamento"} — Parcela 1/${numParcelas}` : (description || undefined),
        due_date: firstDate,
        installment_number: 1,
        total_installments: numParcelas,
        supplier_id: supplier_id || null,
        budget_quote_id: budget_quote_id || null,
        pix_key: pix_key || null,
        status: status ?? "pendente",
        project_id: projectId!,
        user_id: user!.id,
      };

      const { data: firstData, error: firstErr } = await supabase
        .from("payments")
        .insert(firstPayload)
        .select("id")
        .single();
      if (firstErr) throw firstErr;

      if (numParcelas > 1) {
        const remaining = Array.from({ length: numParcelas - 1 }, (_, i) => {
          const idx = i + 2;
          const dueDate = addDays(new Date(firstDate), intervalDays * (idx - 1));
          return {
            value: idx === numParcelas ? lastValue : baseValue,
            description: `${description || "Pagamento"} — Parcela ${idx}/${numParcelas}`,
            due_date: dueDate.toISOString().split("T")[0],
            installment_number: idx,
            total_installments: numParcelas,
            supplier_id: supplier_id || null,
            budget_quote_id: budget_quote_id || null,
            pix_key: pix_key || null,
            parent_payment_id: firstData.id,
            status: status ?? "pendente",
            project_id: projectId!,
            user_id: user!.id,
          };
        });
        const { error: remErr } = await supabase.from("payments").insert(remaining);
        if (remErr) throw remErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
      toast({ title: "Parcelas criadas com sucesso" });
    },
    onError: (e: Error) => toast({ title: "Erro ao criar parcelas", description: e.message, variant: "destructive" }),
  });

  const payRemaining = useMutation({
    mutationFn: async (parentId: string) => {
      const today = new Date().toISOString().split("T")[0];
      // Update the parent itself if unpaid
      const { error: e1 } = await supabase
        .from("payments")
        .update({ status: "pago" as any, paid_date: today })
        .eq("id", parentId)
        .neq("status", "pago");
      if (e1) throw e1;
      // Update children
      const { error: e2 } = await supabase
        .from("payments")
        .update({ status: "pago" as any, paid_date: today })
        .eq("parent_payment_id", parentId)
        .neq("status", "pago");
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
      toast({ title: "Parcelas quitadas" });
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

  return { items: query.data ?? [], isLoading: query.isLoading, create, createInstallments, payRemaining, update, remove };
}
