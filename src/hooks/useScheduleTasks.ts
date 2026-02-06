import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useScheduleTasks(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["schedule_tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_tasks")
        .select("*, scope_items(discipline)")
        .eq("project_id", projectId!)
        .order("order_index", { ascending: true, nullsFirst: false })
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: {
      task_name: string;
      scope_item_id?: string;
      start_date?: string;
      end_date?: string;
      status?: string;
      payment_note?: string;
      order_index?: number;
    }) => {
      const { error } = await supabase.from("schedule_tasks").insert({
        ...item,
        status: item.status ?? "planejado",
        project_id: projectId!,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_tasks", projectId] });
      toast({ title: "Etapa adicionada ao cronograma" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("schedule_tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_tasks", projectId] });
      toast({ title: "Etapa atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedule_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule_tasks", projectId] });
      toast({ title: "Etapa removida" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
