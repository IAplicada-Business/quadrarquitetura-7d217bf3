import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MaterialIndex {
  id: string;
  activity_type: string;
  material_name: string;
  unit: string;
  index_per_m2: number;
  notes: string | null;
  created_at: string;
}

export function useMaterialIndices() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["material_indices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_indices" as any)
        .select("*")
        .order("activity_type")
        .order("material_name");
      if (error) throw error;
      return (data as any[]) as MaterialIndex[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Omit<MaterialIndex, "id" | "created_at">) => {
      const { error } = await supabase
        .from("material_indices" as any)
        .insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material_indices"] });
      toast({ title: "Índice criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<MaterialIndex>) => {
      const { error } = await supabase
        .from("material_indices" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material_indices"] });
      toast({ title: "Índice atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("material_indices" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material_indices"] });
      toast({ title: "Índice removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { indices: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
