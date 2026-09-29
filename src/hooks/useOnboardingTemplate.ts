import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  sectionsFromRows,
  type OnboardingSection,
  type OnboardingSectionRow,
  type OnboardingTemplateRow,
} from "@/lib/onboarding";

export const ONBOARDING_TEMPLATE_KEY = ["onboarding-template"] as const;

/**
 * Template padrão de onboarding do time (Configurações → Onboarding).
 * Um template is_default por time; criado na primeira gravação.
 */
export function useOnboardingTemplate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ONBOARDING_TEMPLATE_KEY,
    queryFn: async () => {
      const { data: template, error } = await supabase
        .from("onboarding_templates")
        .select("*")
        .eq("is_default", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!template) return { template: null as OnboardingTemplateRow | null, rows: [] as OnboardingSectionRow[] };
      const { data: rows, error: e2 } = await supabase
        .from("onboarding_sections")
        .select("*")
        .eq("template_id", template.id)
        .order("display_order", { ascending: true });
      if (e2) throw e2;
      return { template: template as OnboardingTemplateRow, rows: (rows ?? []) as unknown as OnboardingSectionRow[] };
    },
    enabled: !!user,
  });

  const template = query.data?.template ?? null;
  const sections: OnboardingSection[] = useMemo(() => sectionsFromRows(query.data?.rows), [query.data?.rows]);

  /**
   * Grava a lista inteira: cria o template se não existir, faz upsert das
   * seções (id do cliente) e apaga as que saíram da lista.
   */
  const save = useMutation({
    mutationFn: async (next: OnboardingSection[]) => {
      let templateId = template?.id;
      if (!templateId) {
        const { data, error } = await supabase
          .from("onboarding_templates")
          .insert({ user_id: user!.id, name: "Template padrão", is_default: true })
          .select("id")
          .single();
        if (error) throw error;
        templateId = data.id;
      }

      const rows = next.map((s, i) => ({
        id: s.id,
        template_id: templateId!,
        user_id: user!.id,
        title: s.title,
        body: s.body,
        video_url: s.video_url,
        image_urls: s.image_urls,
        cta_label: s.cta_label,
        cta_url: s.cta_url,
        display_order: i,
        is_active: s.is_active,
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from("onboarding_sections").upsert(rows, { onConflict: "id" });
        if (error) throw error;
      }

      const keep = new Set(next.map((s) => s.id));
      const removed = (query.data?.rows ?? []).filter((r) => !keep.has(r.id)).map((r) => r.id);
      if (removed.length > 0) {
        const { error } = await supabase.from("onboarding_sections").delete().in("id", removed);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_TEMPLATE_KEY });
      queryClient.invalidateQueries({ queryKey: ["project-onboarding"] });
      toast({ title: "Template de onboarding salvo" });
    },
    onError: (e: Error) => toast({ title: "Erro ao salvar template", description: e.message, variant: "destructive" }),
  });

  return {
    template,
    sections,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
    dataUpdatedAt: query.dataUpdatedAt,
    save,
  };
}

/** Upload de vídeo/imagem para o bucket público do onboarding. */
export async function uploadOnboardingMedia(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("onboarding-media").upload(path, file, { contentType: file.type || undefined });
  if (error) throw error;
  const { data } = supabase.storage.from("onboarding-media").getPublicUrl(path);
  return data.publicUrl;
}
