import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface InvoiceNFFilters {
  projectId?: string;
  nfType?: string;
  competenceMonth?: string;
  status?: string;
}

export function useInvoicesNF(filters: InvoiceNFFilters = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["invoices_nf", filters],
    queryFn: async () => {
      let q = supabase
        .from("invoices_nf" as any)
        .select("*, projects(name)")
        .order("issue_date", { ascending: false });

      if (filters.projectId) q = q.eq("project_id", filters.projectId);
      if (filters.nfType) q = q.eq("nf_type", filters.nfType);
      if (filters.competenceMonth) q = q.eq("competence_month", filters.competenceMonth);
      if (filters.status) q = q.eq("status", filters.status);

      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const { error } = await supabase.from("invoices_nf" as any).insert({
        ...item,
        user_id: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices_nf"] });
      toast({ title: "Nota fiscal adicionada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("invoices_nf" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices_nf"] });
      toast({ title: "Nota fiscal atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices_nf" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices_nf"] });
      toast({ title: "Nota fiscal removida" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
