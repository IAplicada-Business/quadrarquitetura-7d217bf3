import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useMaterialCalc(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["material_calculations", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_calculations")
        .select("*")
        .eq("project_id", projectId!)
        .order("category")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: {
      category: string;
      item_name: string;
      unit?: string;
      quantity?: number;
      parameters?: string;
      notes?: string;
    }) => {
      const { error } = await supabase.from("material_calculations").insert({
        category: item.category,
        item_name: item.item_name,
        unit: item.unit,
        quantity: item.quantity,
        parameters: item.parameters ? JSON.parse(item.parameters) : {},
        notes: item.notes,
        project_id: projectId!,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material_calculations", projectId] });
      toast({ title: "Item adicionado à memória de cálculo" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("material_calculations").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material_calculations", projectId] });
      toast({ title: "Item atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("material_calculations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material_calculations", projectId] });
      toast({ title: "Item removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
