import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LaborCost {
  id: string;
  discipline: string;
  activity_type: string | null;
  cost_per_m2: number | null;
  cost_per_unit: number | null;
  unit: string;
  region: string;
  notes: string | null;
  updated_at: string;
}

export function useLaborCosts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["labor_costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labor_costs" as any)
        .select("*")
        .order("discipline");
      if (error) throw error;
      return (data as any[]) as LaborCost[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Omit<LaborCost, "id" | "updated_at">) => {
      const { error } = await supabase
        .from("labor_costs" as any)
        .insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labor_costs"] });
      toast({ title: "Custo de mão de obra criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<LaborCost>) => {
      const { error } = await supabase
        .from("labor_costs" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labor_costs"] });
      toast({ title: "Custo atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("labor_costs" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labor_costs"] });
      toast({ title: "Custo removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { laborCosts: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
