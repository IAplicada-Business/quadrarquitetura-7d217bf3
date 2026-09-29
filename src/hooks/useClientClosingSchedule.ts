import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sanitizeEmptyStrings } from "@/lib/sanitizePayload";

export interface ClosingScheduleItem {
  id: string;
  project_id: string;
  user_id: string;
  description: string;
  delivery_date: string | null;
  closing_date: string | null;
  delivery_time: string | null;
  estimated_value: number | null;
  status: "em_cotacao" | "aprovado" | "comprado" | "entregue";
  display_order: number;
  created_at: string;
}

export function useClientClosingSchedule(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["client_closing_schedule", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_closing_schedule" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("closing_date", { ascending: true })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ClosingScheduleItem[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: Omit<ClosingScheduleItem, "id" | "project_id" | "user_id" | "created_at">) => {
      const { data, error } = await supabase
        .from("client_closing_schedule" as any)
        .insert({
          ...sanitizeEmptyStrings(item as unknown as Record<string, unknown>),
          project_id: projectId,
          user_id: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_closing_schedule", projectId] });
      toast.success("Item adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ClosingScheduleItem>) => {
      const { error } = await supabase
        .from("client_closing_schedule" as any)
        .update(sanitizeEmptyStrings(updates as Record<string, unknown>))
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_closing_schedule", projectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("client_closing_schedule" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_closing_schedule", projectId] });
      toast.success("Item removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { items: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
