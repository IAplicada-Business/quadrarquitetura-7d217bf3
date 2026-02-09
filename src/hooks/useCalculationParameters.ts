import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CalculationParameter {
  id: string;
  category: string;
  parameter_key: string;
  parameter_value: Record<string, number>;
  unit: string | null;
  description: string | null;
}

export function useCalculationParameters() {
  const query = useQuery({
    queryKey: ["calculation_parameters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calculation_parameters")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data as CalculationParameter[];
    },
  });

  return { parameters: query.data ?? [], isLoading: query.isLoading };
}
