import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { PROJECT_ONBOARDING_KEY, useOnboardingTemplate } from "@/hooks/useOnboardingTemplate";
import { onboardingMode, sectionsFromJson, type OnboardingOverrideRow, type OnboardingSection } from "@/lib/onboarding";

/**
 * Onboarding de uma obra (aba Onboarding do projeto).
 *
 * - Sem override, ou override com sections_json nulo: a obra segue ao vivo
 *   o modelo em template_id (null = modelo padrão do time). Mudou o
 *   modelo, mudou a obra.
 * - Override com sections_json: a obra tem a própria cópia das seções e
 *   não é afetada pelos modelos.
 */
export function useProjectOnboarding(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const key = [...PROJECT_ONBOARDING_KEY, projectId];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_project_overrides")
        .select("*")
        .eq("project_id", projectId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as OnboardingOverrideRow | null) ?? null;
    },
    enabled: !!projectId && !!user,
  });

  const override = query.data ?? null;
  const followedTemplateId = override?.template_id ?? null;
  const templateQuery = useOnboardingTemplate(followedTemplateId);

  const mode = onboardingMode(override);
  const customSections = useMemo(
    () => (override && Array.isArray(override.sections_json) ? sectionsFromJson(override.sections_json) : null),
    [override],
  );
  const templateSections = templateQuery.sections;

  /** O que vale hoje para a obra. */
  const effectiveSections: OnboardingSection[] = customSections ?? templateSections;
  const usesTemplate = customSections == null;
  const isEnabled = override ? override.is_enabled : true;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });
  const onError = (title: string) => (e: Error) => toast({ title, description: e.message, variant: "destructive" });

  /** Grava uma cópia personalizada para a obra. */
  const saveOverride = useMutation({
    mutationFn: async ({ sections, is_enabled }: { sections: OnboardingSection[]; is_enabled?: boolean }) => {
      const templateId = followedTemplateId ?? templateQuery.template?.id ?? null;
      const payload = {
        project_id: projectId!,
        user_id: user!.id,
        template_id: templateId,
        source_template_id: templateId,
        is_enabled: is_enabled ?? (override?.is_enabled ?? true),
        sections_json: sections as unknown as never,
      };
      const { error } = await supabase
        .from("onboarding_project_overrides")
        .upsert(payload as never, { onConflict: "project_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Onboarding da obra salvo" });
    },
    onError: onError("Erro ao salvar onboarding"),
  });

  /** A obra passa a seguir este modelo ao vivo (descarta cópia personalizada, se houver). */
  const setTemplate = useMutation({
    mutationFn: async (templateId: string | null) => {
      const payload = {
        project_id: projectId!,
        user_id: user!.id,
        template_id: templateId,
        source_template_id: templateId,
        is_enabled: override?.is_enabled ?? true,
        sections_json: null,
      };
      const { error } = await supabase
        .from("onboarding_project_overrides")
        .upsert(payload as never, { onConflict: "project_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Modelo de onboarding da obra atualizado" });
    },
    onError: onError("Erro ao trocar modelo"),
  });

  const setEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (override) {
        const { error } = await supabase.from("onboarding_project_overrides").update({ is_enabled: enabled }).eq("id", override.id);
        if (error) throw error;
      } else {
        // Sem override ainda: cria um que segue o modelo padrão, só pra guardar o interruptor.
        const { error } = await supabase.from("onboarding_project_overrides").upsert(
          { project_id: projectId!, user_id: user!.id, template_id: null, is_enabled: enabled, sections_json: null } as never,
          { onConflict: "project_id" },
        );
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError: onError("Erro"),
  });

  /** Apaga a cópia personalizada; a obra volta a seguir o modelo escolhido ao vivo. */
  const resetToTemplate = useMutation({
    mutationFn: async () => {
      if (!override) return;
      const { error } = await supabase.from("onboarding_project_overrides").update({ sections_json: null }).eq("id", override.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Obra voltou a seguir o modelo" });
    },
    onError: onError("Erro"),
  });

  return {
    override,
    mode,
    customSections,
    templateSections,
    /** Modelo que a obra segue (resolvido: escolhido ou padrão). */
    template: templateQuery.template,
    templates: templateQuery.templates,
    defaultTemplate: templateQuery.defaultTemplate,
    followedTemplateId,
    effectiveSections,
    usesTemplate,
    isEnabled,
    isLoading: query.isLoading || templateQuery.isLoading,
    isFetched: query.isFetched && templateQuery.isFetched,
    dataUpdatedAt: Math.max(query.dataUpdatedAt, templateQuery.dataUpdatedAt),
    saveOverride,
    setTemplate,
    setEnabled,
    resetToTemplate,
  };
}
