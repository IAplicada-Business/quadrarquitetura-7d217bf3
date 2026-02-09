import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Proposal {
  id: string;
  user_id: string;
  lead_id: string;
  project_description: string | null;
  value: number | null;
  discount_percent: number | null;
  payment_conditions: string | null;
  deadline: string | null;
  template_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  leads?: { name: string; phone: string; email: string | null } | null;
}

export function useProposals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const proposalsQuery = useQuery({
    queryKey: ["proposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*, leads(name, phone, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Proposal[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (proposal: { lead_id: string; project_description?: string; value?: number; discount_percent?: number; payment_conditions?: string; deadline?: string; template_name?: string }) => {
      const { error } = await supabase.from("proposals").insert({ ...proposal, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposta criada" });
    },
    onError: (e: Error) => toast({ title: "Erro ao criar proposta", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("proposals").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposta atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposta removida" });
    },
    onError: (e: Error) => toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  return { proposals: proposalsQuery.data ?? [], isLoading: proposalsQuery.isLoading, create, update, remove };
}
