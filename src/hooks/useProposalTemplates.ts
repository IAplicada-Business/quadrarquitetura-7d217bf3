import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ProposalTemplate {
  id: string;
  user_id: string;
  name: string;
  template_type: string | null;
  introduction: string | null;
  methodology: string | null;
  differentials: string | null;
  terms: string | null;
  footer: string | null;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export function useProposalTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["proposal_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposal_templates")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ProposalTemplate[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (t: Partial<ProposalTemplate>) => {
      const { error } = await supabase.from("proposal_templates").insert({ ...t, user_id: user!.id, name: t.name || "Novo Template" } as any);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposal_templates"] }); toast({ title: "Template criado" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("proposal_templates").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposal_templates"] }); toast({ title: "Template atualizado" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposal_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposal_templates"] }); toast({ title: "Template removido" }); },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { templates: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
