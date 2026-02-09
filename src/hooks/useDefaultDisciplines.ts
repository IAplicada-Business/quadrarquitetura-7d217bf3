import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DefaultDiscipline {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

export function useDefaultDisciplines() {
  const query = useQuery({
    queryKey: ["default_disciplines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("default_disciplines")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as DefaultDiscipline[];
    },
  });

  return { disciplines: query.data ?? [], isLoading: query.isLoading };
}
