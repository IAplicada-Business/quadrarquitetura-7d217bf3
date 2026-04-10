import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ContentSeries {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
}

export function useContentSeries() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["content_series"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_series" as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as unknown as ContentSeries[];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (values: { name: string; description?: string; color?: string }) => {
      const { error } = await supabase.from("content_series" as any).insert({
        user_id: user!.id,
        ...values,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_series"] });
      toast({ title: "Série criada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...values }: { id: string; name?: string; description?: string; color?: string }) => {
      const { error } = await supabase.from("content_series" as any).update(values as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_series"] });
      toast({ title: "Série atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_series" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_series"] });
      toast({ title: "Série excluída" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { series: query.data || [], isLoading: query.isLoading, create, update, remove };
}
