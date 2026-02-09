import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface SiteVisit {
  id: string;
  project_id: string;
  visit_date: string;
  visit_type: string;
  notes: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  projects?: { name: string };
}

export function useSiteVisits(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["site_visits", projectId],
    queryFn: async () => {
      let q = supabase
        .from("site_visits")
        .select("*, projects(name)")
        .order("visit_date", { ascending: true });
      
      if (projectId) {
        q = q.eq("project_id", projectId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as SiteVisit[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (data: Omit<SiteVisit, "id" | "projects">) => {
      const { error } = await supabase.from("site_visits").insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_visits"] });
      toast({ title: "Visita agendada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { visits: query.data ?? [], isLoading: query.isLoading, create };
}
