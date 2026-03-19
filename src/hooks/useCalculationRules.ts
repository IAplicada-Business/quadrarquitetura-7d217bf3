import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export interface CalculationRule {
  id: string;
  user_id: string;
  discipline: string;
  variable_name: string;
  formula: string;
  result_name: string;
  unit: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CalculationRuleInsert = Omit<CalculationRule, "id" | "created_at" | "updated_at">;

const DEFAULT_RULES: Omit<CalculationRuleInsert, "user_id">[] = [
  { discipline: "Alvenaria", variable_name: "Área da parede (m²)", formula: "m² × 25", result_name: "Tijolos", unit: "un", notes: null, is_active: true },
  { discipline: "Alvenaria", variable_name: "Área da parede (m²)", formula: "m² × 15", result_name: "Argamassa", unit: "kg", notes: null, is_active: true },
  { discipline: "Elétrica", variable_name: "Número de tomadas", formula: "quantidade × 2.5", result_name: "Metros de fio", unit: "m", notes: null, is_active: true },
  { discipline: "Elétrica", variable_name: "Número de pontos", formula: "quantidade × 1", result_name: "Caixinhas 4x2", unit: "un", notes: null, is_active: true },
  { discipline: "Pintura", variable_name: "Área da parede (m²)", formula: "m² / 5", result_name: "Galões de tinta (18L)", unit: "un", notes: null, is_active: true },
  { discipline: "Pintura", variable_name: "Área da parede (m²)", formula: "m² / 3", result_name: "Massa corrida (25kg)", unit: "saco", notes: null, is_active: true },
  { discipline: "Piso", variable_name: "Área do piso (m²)", formula: "m² × 1.1", result_name: "Piso (com 10% perda)", unit: "m²", notes: null, is_active: true },
  { discipline: "Gesso/Forro", variable_name: "Área do teto (m²)", formula: "m² × 1.05", result_name: "Placas de gesso", unit: "m²", notes: null, is_active: true },
  { discipline: "Hidráulica", variable_name: "Número de pontos", formula: "quantidade × 3", result_name: "Metros de tubo", unit: "m", notes: null, is_active: true },
];

export function useCalculationRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const seeded = useRef(false);

  const query = useQuery({
    queryKey: ["calculation_rules", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculation_rules" as any)
        .select("*")
        .order("discipline", { ascending: true });
      if (error) throw error;
      return data as unknown as CalculationRule[];
    },
    enabled: !!user,
  });

  // Auto-seed defaults on first load
  useEffect(() => {
    if (!user || query.isLoading || seeded.current) return;
    if (query.data && query.data.length === 0) {
      seeded.current = true;
      const rows = DEFAULT_RULES.map((r) => ({ ...r, user_id: user.id }));
      supabase
        .from("calculation_rules" as any)
        .insert(rows as any)
        .then(({ error }) => {
          if (!error) queryClient.invalidateQueries({ queryKey: ["calculation_rules"] });
        });
    }
  }, [user, query.data, query.isLoading, queryClient]);

  const createRule = useMutation({
    mutationFn: async (rule: Omit<CalculationRuleInsert, "user_id">) => {
      const { error } = await supabase
        .from("calculation_rules" as any)
        .insert({ ...rule, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculation_rules"] });
      toast.success("Regra criada");
    },
    onError: () => toast.error("Erro ao criar regra"),
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CalculationRule> & { id: string }) => {
      const { error } = await supabase
        .from("calculation_rules" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculation_rules"] });
      toast.success("Regra atualizada");
    },
    onError: () => toast.error("Erro ao atualizar regra"),
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calculation_rules" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculation_rules"] });
      toast.success("Regra removida");
    },
    onError: () => toast.error("Erro ao remover regra"),
  });

  return {
    rules: query.data ?? [],
    isLoading: query.isLoading,
    createRule,
    updateRule,
    deleteRule,
  };
}
