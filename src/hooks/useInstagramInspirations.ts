import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface InstagramInspiration {
  id: string;
  user_id: string;
  title: string;
  source_url: string | null;
  image_url: string | null;
  category: string;
  tags: string[] | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export function useInstagramInspirations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["instagram_inspirations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_inspirations" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InstagramInspiration[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: Omit<InstagramInspiration, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("instagram_inspirations" as any).insert({ ...input, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram_inspirations"] });
      toast({ title: "Inspiração salva" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstagramInspiration> & { id: string }) => {
      const { error } = await supabase.from("instagram_inspirations" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["instagram_inspirations"] }),
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instagram_inspirations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram_inspirations"] });
      toast({ title: "Removida" });
    },
  });

  return {
    inspirations: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
