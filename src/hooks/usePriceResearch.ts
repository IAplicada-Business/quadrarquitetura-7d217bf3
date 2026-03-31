import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface PriceResearch {
  id: string;
  project_id: string;
  activity_id: string;
  material_name: string;
  price_min: number | null;
  price_max: number | null;
  price_avg: number | null;
  unit: string | null;
  suppliers: any[];
  searched_at: string;
  user_id: string;
}

export function usePriceResearch(projectId: string | undefined, activityId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["price_research", projectId, activityId],
    queryFn: async () => {
      let q = supabase
        .from("price_research" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("searched_at", { ascending: false });

      if (activityId) {
        q = q.eq("activity_id", activityId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]) as PriceResearch[];
    },
    enabled: !!projectId,
  });

  const saveResults = useMutation({
    mutationFn: async (items: Omit<PriceResearch, "id" | "price_avg" | "searched_at">[]) => {
      const { error } = await supabase
        .from("price_research" as any)
        .insert(items.map((item) => ({ ...item, user_id: user!.id })) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price_research", projectId] });
      toast({ title: "Pesquisa de preços salva" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao salvar pesquisa", description: e.message, variant: "destructive" }),
  });

  // Check if there's a recent research (< 7 days) for a given activity
  const getRecentForActivity = (actId: string): PriceResearch[] => {
    if (!query.data) return [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return query.data.filter(
      (r) => r.activity_id === actId && new Date(r.searched_at) > sevenDaysAgo
    );
  };

  return {
    research: query.data ?? [],
    isLoading: query.isLoading,
    saveResults,
    getRecentForActivity,
  };
}
