import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface SupplierAllocation {
  id: string;
  project_id: string;
  supplier_id: string;
  discipline: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  notes: string | null;
  contracted_value: number | null;
  final_value: number | null;
  rating: number | null;
  suppliers?: { name: string; category: string | null };
  projects?: { name: string };
}

export function useSupplierAllocations(projectId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["supplier_allocations", projectId],
    queryFn: async () => {
      let q = supabase
        .from("supplier_allocations")
        .select("*, suppliers(name, category), projects(name)")
        .order("start_date", { ascending: true });
      
      if (projectId) {
        q = q.eq("project_id", projectId);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as SupplierAllocation[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (data: Omit<SupplierAllocation, "id" | "suppliers" | "projects">) => {
      const { error } = await supabase.from("supplier_allocations").insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier_allocations"] });
      toast({ title: "Alocação criada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; rating?: number | null; notes?: string | null; final_value?: number | null; contracted_value?: number | null }) => {
      const { error } = await supabase.from("supplier_allocations").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier_allocations"] });
      queryClient.invalidateQueries({ queryKey: ["supplier_allocations_detail"] });
      toast({ title: "Alocação atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplier_allocations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier_allocations"] });
      toast({ title: "Alocação removida" });
    },
  });

  return { allocations: query.data ?? [], isLoading: query.isLoading, create, update, remove };
}
