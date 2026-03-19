import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface ProposalAsset {
  id: string;
  user_id: string;
  category: string;
  name: string;
  description: string | null;
  file_url: string | null;
  project_name: string | null;
  project_category: string | null;
  display_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useProposalAssets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["proposal-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposal_assets")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as unknown as ProposalAsset[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (asset: Partial<ProposalAsset>) => {
      const { error } = await supabase
        .from("proposal_assets")
        .insert({ ...asset, user_id: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-assets"] });
      toast({ title: "Asset adicionado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase.from("proposal_assets").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-assets"] });
      toast({ title: "Asset atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposal_assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal-assets"] });
      toast({ title: "Asset removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("proposal-assets").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("proposal-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const assets = query.data ?? [];
  const byCategory = (cat: string) => assets.filter((a) => a.category === cat && a.is_active);

  return {
    assets,
    isLoading: query.isLoading,
    logos: byCategory("logo"),
    founderPhotos: byCategory("founder_photo"),
    portfolio: byCategory("portfolio"),
    feedbacks: byCategory("feedback"),
    texts: byCategory("text"),
    contacts: byCategory("contact"),
    create,
    update,
    remove,
    uploadFile,
    byCategory,
  };
}
