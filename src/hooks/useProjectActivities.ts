import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  area_m2: number | null;
  duration_days: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress_percent: number;
  depends_on: string[];
  discipline: string | null;
  position: number;
  created_at: string;
}

export function useProjectActivities(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["project_activities", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_activities" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any[]) as ProjectActivity[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: Partial<ProjectActivity>) => {
      const { data, error } = await supabase
        .from("project_activities" as any)
        .insert({
          ...item,
          project_id: projectId!,
          user_id: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_activities", projectId] });
      toast({ title: "Atividade criada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ProjectActivity>) => {
      const { error } = await supabase
        .from("project_activities" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_activities", projectId] });
      toast({ title: "Atividade atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_activities" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_activities", projectId] });
      toast({ title: "Atividade removida" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { activities: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
