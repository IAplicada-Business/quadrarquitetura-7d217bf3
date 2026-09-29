import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { resizeImage } from "@/lib/imageResize";
import {
  SITE_TEAM_ID,
  resolveSiteContent,
  type SiteContent,
  type SiteContentChanges,
  type SiteContentRow,
} from "@/lib/siteContent";

export const PUBLIC_SITE_CONTENT_QUERY_KEY = ["public-site-content", SITE_TEAM_ID] as const;
export const SITE_CONTENT_QUERY_KEY = ["site-content"] as const;

/** Tempo máximo esperando o banco antes de mostrar o site com o conteúdo padrão. */
const PUBLIC_FETCH_TIMEOUT_MS = 4000;

/**
 * Conteúdo do site público (rota /), sem login.
 *
 * Lê pela função get_public_site_content a cada carregamento da página e
 * ao voltar o foco pra aba, então o que o time publica no admin aparece no
 * próximo acesso, sem redeploy. Se o banco falhar ou demorar, o site
 * mostra o conteúdo padrão em código.
 */
export function usePublicSiteContent() {
  const query = useQuery({
    queryKey: PUBLIC_SITE_CONTENT_QUERY_KEY,
    queryFn: async () => {
      // AbortController + setTimeout em vez de AbortSignal.timeout (Safari < 16 não tem).
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PUBLIC_FETCH_TIMEOUT_MS);
      try {
        const { data, error } = await supabase
          .rpc("get_public_site_content" as never, { p_team_id: SITE_TEAM_ID } as never)
          .abortSignal(controller.signal);
        if (error) throw error;
        return (data ?? []) as unknown as SiteContentRow[];
      } finally {
        clearTimeout(timer);
      }
    },
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
  });

  const content: SiteContent = useMemo(() => resolveSiteContent(query.data), [query.data]);

  return {
    content,
    /** true só enquanto a primeira leitura está em andamento. */
    isLoading: query.isLoading,
  };
}

/** Conteúdo do site do time logado, para a aba Configurações → Site. */
export function useSiteContentAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: SITE_CONTENT_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content" as never)
        .select("id, key, type, value_json, updated_at");
      if (error) throw error;
      return (data ?? []) as unknown as (SiteContentRow & { id: string })[];
    },
    enabled: !!user,
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);
  const content: SiteContent = useMemo(() => resolveSiteContent(rows), [rows]);
  const lastUpdatedAt = useMemo(
    () => rows.reduce<string | null>((max, r) => (r.updated_at && (!max || r.updated_at > max) ? r.updated_at : max), null),
    [rows],
  );

  const publish = useMutation({
    mutationFn: async ({ upserts, deletes }: SiteContentChanges) => {
      if (upserts.length > 0) {
        // team_id vem do DEFAULT (get_my_team_id); updated_by/updated_at do trigger.
        const { error } = await supabase
          .from("site_content" as never)
          .upsert(upserts as never, { onConflict: "team_id,key" });
        if (error) throw error;
      }
      // Apaga pelo id das linhas que o usuário leu (do próprio time), não pela key.
      const ids = rows.filter((r) => deletes.includes(r.key)).map((r) => r.id);
      if (ids.length > 0) {
        const { error } = await supabase
          .from("site_content" as never)
          .delete()
          .in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SITE_CONTENT_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PUBLIC_SITE_CONTENT_QUERY_KEY });
      toast({ title: "Site publicado", description: "As alterações já estão no ar." });
    },
    onError: (e: Error) => toast({ title: "Erro ao publicar", description: e.message, variant: "destructive" }),
  });

  return {
    rows,
    content,
    lastUpdatedAt,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
    dataUpdatedAt: query.dataUpdatedAt,
    publish,
  };
}

/** Redimensiona e sobe a imagem para o bucket público do site. Retorna a URL pública. */
export async function uploadSiteImage(file: File, folder: string, maxWidth = 1600): Promise<string> {
  const { blob, contentType, ext } = await resizeImage(file, maxWidth);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("site-media").upload(path, blob, { contentType });
  if (error) throw error;
  const { data } = supabase.storage.from("site-media").getPublicUrl(path);
  return data.publicUrl;
}
