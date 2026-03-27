import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export function useWeeklyReports(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["weekly_reports", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_reports")
        .select("*")
        .eq("project_id", projectId!)
        .order("week_start", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (input: {
      week_start: string;
      summary: string;
      next_steps: string;
      completion_percent: number;
      client_pending?: string;
      photos?: File[];
    }) => {
      const photoUrls: string[] = [];

      if (input.photos && input.photos.length > 0) {
        for (const file of input.photos) {
          const ext = file.name.split(".").pop() || "jpg";
          const path = `reports/${projectId}/${input.week_start}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("project-files")
            .upload(path, file);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage
            .from("project-files")
            .getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from("weekly_reports").insert({
        project_id: projectId!,
        user_id: user!.id,
        week_start: input.week_start,
        summary: input.summary,
        next_steps: input.next_steps,
        completion_percent: input.completion_percent,
        photo_urls: photoUrls,
        client_pending: input.client_pending || null,
        created_by: user!.email || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly_reports", projectId] });
      toast({ title: "Relatório semanal criado com sucesso" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao criar relatório", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weekly_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly_reports", projectId] });
      toast({ title: "Relatório removido" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { reports: query.data ?? [], isLoading: query.isLoading, create, remove };
}
