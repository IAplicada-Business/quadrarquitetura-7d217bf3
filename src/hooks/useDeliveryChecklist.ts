import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface DeliveryChecklistItem {
  id: string;
  project_id: string;
  user_id: string;
  activity_id: string | null;
  discipline: string | null;
  description: string;
  responsible: string | null;
  due_date: string | null;
  priority: "baixa" | "media" | "alta" | "urgente";
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useDeliveryChecklist(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["delivery_checklist", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_checklist_items" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("resolved", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DeliveryChecklistItem[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: Partial<DeliveryChecklistItem>) => {
      const { error } = await supabase
        .from("delivery_checklist_items" as any)
        .insert({
          ...item,
          project_id: projectId!,
          user_id: user!.id,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery_checklist", projectId] });
      toast({ title: "Item adicionado ao checklist" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryChecklistItem> & { id: string }) => {
      const payload = { ...updates } as any;
      if (Object.prototype.hasOwnProperty.call(updates, "resolved")) {
        payload.resolved_at = updates.resolved ? new Date().toISOString() : null;
      }
      const { error } = await supabase
        .from("delivery_checklist_items" as any)
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery_checklist", projectId] });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("delivery_checklist_items" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery_checklist", projectId] });
      toast({ title: "Item removido" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
