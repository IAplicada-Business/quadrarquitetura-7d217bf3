import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  area_m2: number | null;
  duration_days: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress_percent: number;
  depends_on: string[];
  discipline: string | null;
  position: number;
  created_at: string;
}

async function autoCalculateMaterials(activity: { id: string; area_m2?: number | null; discipline?: string | null; project_id: string; user_id: string }) {
  if (!activity.area_m2 || activity.area_m2 <= 0 || !activity.discipline) return;

  // Fetch matching material indices
  const { data: indices } = await supabase
    .from("material_indices" as any)
    .select("*");
  if (!indices || indices.length === 0) return;

  const matchingIndices = (indices as any[]).filter(
    (idx: any) => idx.activity_type?.toLowerCase() === activity.discipline!.toLowerCase()
  );
  if (matchingIndices.length === 0) return;

  let count = 0;
  for (const idx of matchingIndices) {
    const qty = activity.area_m2 * Number(idx.index_per_m2);

    // Check if already exists
    const { data: existing } = await supabase
      .from("material_tracking")
      .select("id, source")
      .eq("activity_id", activity.id)
      .eq("material_name", idx.material_name)
      .maybeSingle();

    if (!existing) {
      await supabase.from("material_tracking").insert({
        project_id: activity.project_id,
        user_id: activity.user_id,
        activity_id: activity.id,
        material_name: idx.material_name,
        unit: idx.unit,
        discipline: activity.discipline,
        calculated_quantity: qty,
        quantity_needed: qty,
        source: "automatico",
      });
      count++;
    } else if (existing.source === "automatico") {
      await supabase
        .from("material_tracking")
        .update({ calculated_quantity: qty, quantity_needed: qty })
        .eq("id", existing.id);
      count++;
    }
  }

  if (count > 0) {
    toast({ title: `${count} materiais calculados para esta atividade` });
  }
}

export function useProjectActivities(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["project_activities", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_activities" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any[]) as ProjectActivity[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: Partial<ProjectActivity>) => {
      const { data, error } = await supabase
        .from("project_activities" as any)
        .insert({
          ...item,
          project_id: projectId!,
          user_id: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["project_activities", projectId] });
      toast({ title: "Atividade criada" });
      // Auto-calculate materials
      autoCalculateMaterials({
        id: data.id,
        area_m2: data.area_m2,
        discipline: data.discipline,
        project_id: projectId!,
        user_id: user!.id,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["material_tracking", projectId] });
      });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<ProjectActivity>) => {
      const { error } = await supabase
        .from("project_activities" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
      return { id, ...updates };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["project_activities", projectId] });
      toast({ title: "Atividade atualizada" });
      // Auto-calculate materials if area or discipline changed
      if (data.area_m2 !== undefined || data.discipline !== undefined) {
        autoCalculateMaterials({
          id: data.id,
          area_m2: data.area_m2,
          discipline: data.discipline,
          project_id: projectId!,
          user_id: user!.id,
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["material_tracking", projectId] });
        });
      }
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_activities" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_activities", projectId] });
      toast({ title: "Atividade removida" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { activities: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
