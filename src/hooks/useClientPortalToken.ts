import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useClientPortalToken(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["client_portal_token", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_portal_tokens" as any)
        .select("*")
        .eq("project_id", projectId!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!projectId,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("client_portal_tokens" as any)
        .insert({ project_id: projectId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_portal_token", projectId] });
      toast({ title: "Link do portal gerado com sucesso!" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao gerar link", description: e.message, variant: "destructive" }),
  });

  const deactivate = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from("client_portal_tokens" as any)
        .update({ is_active: false } as any)
        .eq("id", tokenId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_portal_token", projectId] });
      toast({ title: "Link desativado" });
    },
    onError: (e: Error) =>
      toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return {
    activeToken: query.data,
    isLoading: query.isLoading,
    createToken: create.mutateAsync,
    deactivateToken: deactivate.mutateAsync,
    isCreating: create.isPending,
  };
}
