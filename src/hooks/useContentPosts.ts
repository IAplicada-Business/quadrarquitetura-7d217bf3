import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { C } from "@/lib/chartColors";

export interface ContentPost {
  id: string;
  user_id: string;
  title: string;
  type: string;
  platform: string;
  status: string;
  scheduled_date: string | null;
  objective: string | null;
  hook: string | null;
  script: string | null;
  hashtags: string[];
  notes: string | null;
  series_id: string | null;
  target_audience: string | null;
  tone: string | null;
  created_at: string;
}

export const POST_TYPES = ["reels", "carrossel", "story", "feed", "live"] as const;
export const POST_STATUSES = ["ideia", "roteiro", "gravando", "editando", "agendado", "publicado"] as const;
export const POST_PLATFORMS = ["instagram", "linkedin", "tiktok"] as const;
export const POST_TONES = ["especialista", "inspiracional", "educativo", "bastidor", "pessoal"] as const;

export const TYPE_COLORS: Record<string, string> = {
  reels:     C.navy,
  carrossel: C.terra,
  story:     C.navyMid,
  feed:      C.success,
  live:      C.danger,
};

export const STATUS_LABELS: Record<string, string> = {
  ideia: "Ideia",
  roteiro: "Roteiro",
  gravando: "Gravando",
  editando: "Editando",
  agendado: "Agendado",
  publicado: "Publicado",
};

export function useContentPosts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["content_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_posts" as any)
        .select("*")
        .order("scheduled_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []) as unknown as ContentPost[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (values: Partial<ContentPost>) => {
      const { error } = await supabase.from("content_posts" as any).insert({
        user_id: user!.id,
        title: values.title,
        type: values.type || "feed",
        platform: values.platform || "instagram",
        status: values.status || "ideia",
        scheduled_date: values.scheduled_date || null,
        objective: values.objective || null,
        hook: values.hook || null,
        script: values.script || null,
        hashtags: values.hashtags || [],
        notes: values.notes || null,
        series_id: values.series_id || null,
        target_audience: values.target_audience || null,
        tone: values.tone || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_posts"] });
      qc.invalidateQueries({ queryKey: ["content_calendar"] });
      toast({ title: "Post criado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...values }: Partial<ContentPost> & { id: string }) => {
      const { error } = await supabase.from("content_posts" as any).update(values as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_posts"] });
      qc.invalidateQueries({ queryKey: ["content_calendar"] });
      toast({ title: "Post atualizado" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_posts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content_posts"] });
      qc.invalidateQueries({ queryKey: ["content_calendar"] });
      toast({ title: "Post excluído" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { posts: query.data || [], isLoading: query.isLoading, create, update, remove };
}
