import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { handleDeleteError } from "@/lib/handleDeleteError";

export interface Contract {
  id: string;
  user_id: string;
  proposal_id: string;
  client_id: string | null;
  template_name: string | null;
  clauses: string | null;
  address: string | null;
  city: string | null;
  value: number | null;
  payment_conditions: string | null;
  start_date: string | null;
  status: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  proposals?: { lead_id: string; value: number | null; leads?: { name: string; phone: string; email: string | null; project_type: string; origin: string } | null } | null;
}

export function useContracts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, proposals(lead_id, value, leads(name, phone, email, project_type, origin))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (contract: { proposal_id: string; client_id?: string; template_name?: string; clauses?: string; address?: string; city?: string; value?: number; payment_conditions?: string; start_date?: string }) => {
      const { error } = await supabase.from("contracts").insert({ ...contract, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contrato criado" });
    },
    onError: (e: Error) => toast({ title: "Erro ao criar contrato", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("contracts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contrato atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast({ title: "Contrato removido" });
    },
    onError: (e: any) => handleDeleteError(e, "contracts"),
  });

  const signAndCreateProject = useMutation({
    mutationFn: async (contract: Contract) => {
      const lead = contract.proposals?.leads;
      const leadId = contract.proposals?.lead_id;

      // Get next Q-prefixed project_number
      const { data: rows } = await supabase.from("projects").select("project_number");
      const maxNum = (rows ?? []).reduce((max: number, r: any) => {
        const n = parseInt(String(r.project_number ?? "").replace("Q", ""), 10);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const nextNumber = `Q${maxNum + 1}`;

      // 1. Create project
      const { data: project, error: projError } = await supabase
        .from("projects")
        .insert({
          user_id: user!.id,
          name: lead?.name ? `Projeto ${lead.name}` : "Novo Projeto",
          client_id: contract.client_id,
          address: contract.address,
          city: contract.city,
          estimated_budget: contract.value,
          project_type: (lead?.project_type as any) || "residencial",
          status: "contrato" as any,
          contract_id: contract.id,
          project_number: nextNumber,
          source_proposal_id: contract.proposal_id,
        } as any)
        .select()
        .single();
      if (projError) throw projError;

      // 2. Update contract with project_id and status
      const { error: contractErr } = await supabase
        .from("contracts")
        .update({ status: "assinado", project_id: project.id })
        .eq("id", contract.id);
      if (contractErr) throw contractErr;

      // 3. Mark lead as fechado if not already
      if (leadId) {
        await supabase.from("leads").update({ status: "fechado" }).eq("id", leadId);
      }

      // 4. Insert revenue payment (source: escritorio)
      await supabase.from("payments").insert({
        user_id: user!.id,
        project_id: project.id,
        description: `Honorários — ${lead?.name || "Projeto"}`,
        value: contract.value || contract.proposals?.value || 0,
        status: "pendente" as any,
        supplier_name: "Receita Escritório",
        source: "escritorio",
      } as any);

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Contrato assinado e projeto criado!" });
    },
    onError: (e: Error) => toast({ title: "Erro ao assinar contrato", description: e.message, variant: "destructive" }),
  });

  return { contracts: contractsQuery.data ?? [], isLoading: contractsQuery.isLoading, create, update, remove, signAndCreateProject };
}
