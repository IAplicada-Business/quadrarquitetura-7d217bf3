import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useDefaultDisciplines } from "@/hooks/useDefaultDisciplines";

export interface ScenarioItem {
  id: string;
  user_id: string;
  scenario_id: string;
  discipline: string;
  description: string | null;
  estimated_value: number;
  is_included: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Scenario {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  total_value: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  scenario_items?: ScenarioItem[];
}

export function useScenarios(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { disciplines: defaultDisciplines } = useDefaultDisciplines();

  const scenariosQuery = useQuery({
    queryKey: ["scenarios", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenarios")
        .select("*, scenario_items(*)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Scenario[];
    },
    enabled: !!projectId && !!user,
  });

  const createScenario = useMutation({
    mutationFn: async (name: string) => {
      const { data: scenario, error } = await supabase
        .from("scenarios")
        .insert({ user_id: user!.id, project_id: projectId, name })
        .select()
        .single();
      if (error) throw error;

      // Auto-populate with default disciplines
      if (defaultDisciplines.length > 0) {
        const items = defaultDisciplines.map((d) => ({
          scenario_id: scenario.id,
          user_id: user!.id,
          discipline: d.name,
          display_order: d.display_order,
          estimated_value: 0,
          is_included: true,
        }));
        await supabase.from("scenario_items").insert(items);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
      toast({ title: "Cenário criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeScenario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scenarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
      toast({ title: "Cenário removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const addItem = useMutation({
    mutationFn: async (item: { scenario_id: string; discipline: string; description?: string; estimated_value?: number; is_included?: boolean; display_order?: number }) => {
      const { error } = await supabase.from("scenario_items").insert({ ...item, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("scenario_items").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scenario_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const approveScenario = useMutation({
    mutationFn: async (scenario: Scenario) => {
      // 1. Mark scenario as approved
      const { error: approveErr } = await supabase
        .from("scenarios")
        .update({ is_approved: true })
        .eq("id", scenario.id);
      if (approveErr) throw approveErr;

      // 2. Un-approve others
      const { error: unApproveErr } = await supabase
        .from("scenarios")
        .update({ is_approved: false })
        .eq("project_id", projectId)
        .neq("id", scenario.id);
      if (unApproveErr) throw unApproveErr;

      // 3. Copy items to scope_items with scope_type='projeto'
      const includedItems = (scenario.scenario_items || []).filter((i) => i.is_included);
      if (includedItems.length > 0) {
        // Clear existing scope first? Maybe optional, but for now append or sync logic is complex.
        // Let's just append new ones if scope is empty, or warn user.
        // For simplicity: Append.
        const scopeInserts = includedItems.map((item, idx) => ({
          user_id: user!.id,
          project_id: projectId,
          discipline: item.discipline,
          description: item.description,
          estimated_value: item.estimated_value,
          entry_order: idx + 1,
          scope_type: "projeto", // Explicitly set scope type
        }));
        const { error: scopeErr } = await supabase.from("scope_items").insert(scopeInserts);
        if (scopeErr) throw scopeErr;
      }

      // 4. Update project total
      const total = includedItems.reduce((sum, i) => sum + (i.estimated_value || 0), 0);
      const { error: projErr } = await supabase
        .from("projects")
        .update({ approved_scenario_id: scenario.id, client_budget: total })
        .eq("id", projectId);
      if (projErr) throw projErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["scope_items", projectId] });
      toast({ title: "Cenário aprovado e escopo preenchido!" });
    },
    onError: (e: Error) => toast({ title: "Erro ao aprovar", description: e.message, variant: "destructive" }),
  });

  return {
    scenarios: scenariosQuery.data ?? [],
    isLoading: scenariosQuery.isLoading,
    createScenario,
    removeScenario,
    addItem,
    updateItem,
    removeItem,
    approveScenario,
  };
}
