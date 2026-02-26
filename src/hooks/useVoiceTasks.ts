import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface VoiceTask {
  id: string;
  user_id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  responsible: string | null;
  task_type: string;
  category: string;
  status: string;
  priority: string;
  due_date: string | null;
  source_transcript: string | null;
  created_at: string;
  updated_at: string;
}

export function useVoiceTasks(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["voice_tasks", projectId],
    queryFn: async () => {
      let q = supabase
        .from("voice_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (projectId) {
        q = q.eq("project_id", projectId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as VoiceTask[];
    },
    enabled: !!user,
  });

  const createBatchMutation = useMutation({
    mutationFn: async ({
      tasks,
      projectId,
      transcript,
    }: {
      tasks: any[];
      projectId: string;
      transcript: string;
    }) => {
      const records: any[] = [];

      for (const task of tasks) {
        const parentRecord = {
          user_id: user!.id,
          project_id: projectId,
          title: task.title,
          description: task.description || null,
          responsible: task.responsible || null,
          task_type: task.task_type || "geral",
          category: task.category || "pendencias",
          priority: task.priority || "media",
          due_date: task.due_date || null,
          source_transcript: transcript,
        };

        console.log("[VoiceTasks] Inserting parent task:", parentRecord);

        const { data: parent, error: parentError } = await supabase
          .from("voice_tasks")
          .insert(parentRecord)
          .select()
          .single();

        if (parentError) {
          console.error("[VoiceTasks] Parent insert error:", parentError);
          throw parentError;
        }
        console.log("[VoiceTasks] Parent created:", parent);
        records.push(parent);

        if (task.subtasks?.length) {
          for (const sub of task.subtasks) {
            const subRecord = {
              user_id: user!.id,
              project_id: projectId,
              parent_id: (parent as any).id,
              title: sub.title,
              description: sub.description || null,
              responsible: sub.responsible || null,
              task_type: sub.task_type || task.task_type || "geral",
              category: sub.category || task.category || "pendencias",
              priority: sub.priority || task.priority || "media",
              source_transcript: transcript,
            };

            console.log("[VoiceTasks] Inserting subtask:", subRecord);

            const { data: child, error: childError } = await supabase
              .from("voice_tasks")
              .insert(subRecord)
              .select()
              .single();

            if (childError) {
              console.error("[VoiceTasks] Subtask insert error:", childError);
              throw childError;
            }
            records.push(child);
          }
        }
      }

      return records as unknown as VoiceTask[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["voice_tasks"] });
      toast({
        title: "Tarefas criadas",
        description: `${data.length} tarefa(s) criada(s) com sucesso.`,
      });
    },
    onError: (error: any) => {
      console.error("[VoiceTasks] createBatch error:", error);
      toast({
        title: "Erro ao criar tarefas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VoiceTask> & { id: string }) => {
      const { error } = await supabase
        .from("voice_tasks")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice_tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("voice_tasks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice_tasks"] });
    },
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    createBatch: createBatchMutation.mutateAsync,
    isCreating: createBatchMutation.isPending,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
  };
}
