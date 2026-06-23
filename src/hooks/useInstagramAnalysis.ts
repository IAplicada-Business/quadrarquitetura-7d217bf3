import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type InstagramProfile = Tables<"instagram_profiles">;
export type InstagramMetric = Tables<"instagram_metrics">;

export function useInstagramAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profilesQuery = useQuery({
    queryKey: ["instagram_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_profiles")
        .select("*")
        .order("kind") // 'self' antes de 'reference'
        .order("handle");
      if (error) throw error;
      return data as InstagramProfile[];
    },
    enabled: !!user,
  });

  const metricsQuery = useQuery({
    queryKey: ["instagram_metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_metrics")
        .select("*")
        .order("period_start", { ascending: false });
      if (error) throw error;
      return data as InstagramMetric[];
    },
    enabled: !!user,
  });

  const createProfile = useMutation({
    mutationFn: async (input: Omit<TablesInsert<"instagram_profiles">, "user_id">) => {
      const { error } = await supabase
        .from("instagram_profiles")
        .insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram_profiles"] });
      toast({ title: "Perfil adicionado" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"instagram_profiles">) => {
      const { error } = await supabase
        .from("instagram_profiles")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram_profiles"] });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instagram_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["instagram_metrics"] });
      toast({ title: "Perfil removido" });
    },
  });

  const createMetric = useMutation({
    mutationFn: async (input: Omit<TablesInsert<"instagram_metrics">, "user_id">) => {
      const { error } = await supabase
        .from("instagram_metrics")
        .insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram_metrics"] });
      toast({ title: "Métricas adicionadas" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMetric = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"instagram_metrics">) => {
      const { error } = await supabase.from("instagram_metrics").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram_metrics"] });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeMetric = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instagram_metrics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram_metrics"] });
    },
  });

  return {
    profiles: profilesQuery.data ?? [],
    metrics: metricsQuery.data ?? [],
    isLoading: profilesQuery.isLoading || metricsQuery.isLoading,
    createProfile,
    updateProfile,
    removeProfile,
    createMetric,
    updateMetric,
    removeMetric,
  };
}
