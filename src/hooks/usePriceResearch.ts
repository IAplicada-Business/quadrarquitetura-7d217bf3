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

export type PriceStatus = "green" | "yellow" | "red";

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

  // Get price status for an activity based on most recent search
  const getPriceStatus = (actId: string): PriceStatus => {
    if (!query.data) return "red";
    const actResearch = query.data.filter((r) => r.activity_id === actId);
    if (actResearch.length === 0) return "red";

    const mostRecent = new Date(actResearch[0].searched_at); // already sorted desc
    const now = new Date();
    const diffDays = (now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 7) return "green";
    if (diffDays < 30) return "yellow";
    return "red";
  };

  // Filter activities that need a new search (> 7 days or no data)
  const getActivitiesNeedingSearch = (activities: { id: string }[]): string[] => {
    return activities
      .filter((a) => getPriceStatus(a.id) !== "green")
      .map((a) => a.id);
  };

  // Get the most recent searched_at date across all project research
  const getLastUpdateDate = (): Date | null => {
    if (!query.data || query.data.length === 0) return null;
    return new Date(query.data[0].searched_at); // sorted desc
  };

  return {
    research: query.data ?? [],
    isLoading: query.isLoading,
    saveResults,
    getRecentForActivity,
    getPriceStatus,
    getActivitiesNeedingSearch,
    getLastUpdateDate,
  };
}
