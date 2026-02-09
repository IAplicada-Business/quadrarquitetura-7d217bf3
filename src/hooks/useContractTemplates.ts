import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ContractTemplate {
  id: string;
  user_id: string;
  name: string;
  contract_type: string | null;
  clause_object: string | null;
  clause_scope: string | null;
  clause_value: string | null;
  clause_duration: string | null;
  clause_obligations_contractor: string | null;
  clause_obligations_client: string | null;
  clause_termination: string | null;
  clause_confidentiality: string | null;
  clause_general: string | null;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export function useContractTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contract_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ContractTemplate[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (t: Partial<ContractTemplate>) => {
      const { error } = await supabase.from("contract_templates").insert({ ...t, user_id: user!.id, name: t.name || "Novo Template" } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contract_templates"] }); toast({ title: "Template criado" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("contract_templates").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contract_templates"] }); toast({ title: "Template atualizado" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contract_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contract_templates"] }); toast({ title: "Template removido" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { templates: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
