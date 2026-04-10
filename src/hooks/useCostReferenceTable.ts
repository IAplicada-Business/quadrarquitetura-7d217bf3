import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ConstructionType = "reforma_completa" | "reforma_parcial" | "construcao" | "ampliacao";
export type FinishLevel = "basico" | "intermediario" | "alto_padrao" | "luxo";

export type CostTable = Record<ConstructionType, Record<FinishLevel, number>>;

export const CONSTRUCTION_TYPE_LABELS: Record<ConstructionType, string> = {
  reforma_completa: "Reforma Completa",
  reforma_parcial: "Reforma Parcial",
  construcao: "Construção",
  ampliacao: "Ampliação",
};

export const FINISH_LEVEL_LABELS: Record<FinishLevel, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  alto_padrao: "Alto Padrão",
  luxo: "Luxo",
};

export const DEFAULT_COST_TABLE: CostTable = {
  reforma_completa: { basico: 1200, intermediario: 2000, alto_padrao: 3500, luxo: 5500 },
  reforma_parcial: { basico: 800, intermediario: 1400, alto_padrao: 2500, luxo: 4000 },
  construcao: { basico: 1500, intermediario: 2500, alto_padrao: 4000, luxo: 6500 },
  ampliacao: { basico: 1000, intermediario: 1800, alto_padrao: 3000, luxo: 5000 },
};

export const FINISH_LEVEL_MAP: Record<number, FinishLevel> = {
  1: "basico",
  2: "intermediario",
  3: "alto_padrao",
  4: "luxo",
};

export function useCostReferenceTable() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["settings_cost_table", user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_COST_TABLE;
      const { data, error } = await supabase
        .from("settings")
        .select("id, calculation_params, user_id")
        .eq("scope" as never, "team")
        .maybeSingle();
      if (error) throw error;
      const params = data?.calculation_params as Record<string, unknown> | null;
      if (params?.cost_per_sqm_table) {
        return params.cost_per_sqm_table as CostTable;
      }
      return DEFAULT_COST_TABLE;
    },
    enabled: !!user,
  });

  const saveCostTable = useMutation({
    mutationFn: async (table: CostTable) => {
      if (!user) throw new Error("Not authenticated");

      // Get existing team settings
      const { data: existing } = await supabase
        .from("settings")
        .select("id, calculation_params")
        .eq("scope" as never, "team")
        .maybeSingle();

      const existingParams = (existing?.calculation_params as Record<string, unknown>) || {};
      const newParams = { ...existingParams, cost_per_sqm_table: table };

      if (existing) {
        const { error } = await supabase
          .from("settings")
          .update({ calculation_params: newParams } as never)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("settings")
          .insert({ user_id: user.id, calculation_params: newParams, scope: "team" } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings_cost_table"] });
      toast({ title: "Tabela de custos atualizada" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  return {
    costTable: query.data ?? DEFAULT_COST_TABLE,
    isLoading: query.isLoading,
    saveCostTable,
  };
}
