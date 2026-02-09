import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface SiteDiaryEntry {
  id: string;
  project_id: string;
  entry_date: string;
  weather: string | null;
  workers_count: number | null;
  summary: string | null;
  observations: string | null;
  photos: string[] | null;
  disciplines_active: string[] | null;
  created_at: string;
}

export function useSiteDiary(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["site_diary", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_diary_entries")
        .select("*")
        .eq("project_id", projectId!)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data as SiteDiaryEntry[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (entry: Partial<SiteDiaryEntry>) => {
      const { error } = await supabase.from("site_diary_entries").insert({
        ...entry,
        project_id: projectId!,
        user_id: user!.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_diary", projectId] });
      toast({ title: "Registro adicionado ao diário" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_diary_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_diary", projectId] });
      toast({ title: "Registro removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { entries: query.data ?? [], isLoading: query.isLoading, create, remove };
}
