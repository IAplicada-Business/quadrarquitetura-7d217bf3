import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface SupplierScope {
  id: string;
  project_id: string;
  supplier_id: string;
  discipline: string | null;
  activities: any;
  sent_at: string | null;
  status: string;
  quoted_value: number | null;
  user_id: string;
  created_at: string;
  supplier_name?: string;
}

export function useSupplierScopes(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["supplier_scopes", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_scopes" as any)
        .select("*, suppliers(name)")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((d: any) => ({
        ...d,
        supplier_name: d.suppliers?.name,
      })) as SupplierScope[];
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async (item: Partial<SupplierScope>) => {
      const { data, error } = await supabase
        .from("supplier_scopes" as any)
        .insert({ ...item, project_id: projectId!, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier_scopes", projectId] });
      toast({ title: "Escopo salvo" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  /* Um fornecedor costuma pegar várias disciplinas (a construtora faz
     alvenaria + hidráulica + cobertura). A tabela guarda uma disciplina por
     linha, então grava-se uma linha por disciplina de uma vez só — sem
     migration e sem um toast por disciplina. */
  const createMany = useMutation({
    mutationFn: async (items: Partial<SupplierScope>[]) => {
      if (items.length === 0) return [];
      const { data, error } = await supabase
        .from("supplier_scopes" as never)
        .insert(items.map(i => ({ ...i, project_id: projectId!, user_id: user!.id })) as never)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["supplier_scopes", projectId] });
      const n = Array.isArray(data) ? data.length : 0;
      toast({ title: n > 1 ? `Escopo salvo para ${n} disciplinas` : "Escopo salvo" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<SupplierScope>) => {
      const { error } = await supabase
        .from("supplier_scopes" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier_scopes", projectId] });
      toast({ title: "Escopo atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("supplier_scopes" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier_scopes", projectId] });
      toast({ title: "Escopo removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { scopes: query.data ?? [], isLoading: query.isLoading, create, createMany, update, remove };
}
