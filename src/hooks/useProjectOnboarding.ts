import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useOnboardingTemplate } from "@/hooks/useOnboardingTemplate";
import { sectionsFromJson, type OnboardingOverrideRow, type OnboardingSection } from "@/lib/onboarding";

/**
 * Onboarding de uma obra (aba Onboarding do projeto).
 *
 * - Sem override: a obra usa o template padrão do time ao vivo
 *   (mudou o template, mudou a obra).
 * - Com override: a obra tem a própria cópia das seções e não é afetada
 *   pelo template.
 */
export function useProjectOnboarding(projectId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const templateQuery = useOnboardingTemplate();

  const key = ["project-onboarding", projectId];

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
  const overrideSections = useMemo(() => (override ? sectionsFromJson(override.sections_json) : null), [override]);
  const templateSections = templateQuery.sections;

  /** O que vale hoje para a obra. */
  const effectiveSections: OnboardingSection[] = overrideSections ?? templateSections;
  const usesTemplate = !override;
  const isEnabled = override ? override.is_enabled : true;

  const saveOverride = useMutation({
    mutationFn: async ({ sections, is_enabled }: { sections: OnboardingSection[]; is_enabled?: boolean }) => {
      const payload = {
        project_id: projectId!,
        user_id: user!.id,
        source_template_id: templateQuery.template?.id ?? null,
        is_enabled: is_enabled ?? (override?.is_enabled ?? true),
        sections_json: sections as unknown as never,
      };
      const { error } = await supabase
        .from("onboarding_project_overrides")
        .upsert(payload as never, { onConflict: "project_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Onboarding da obra salvo" });
    },
    onError: (e: Error) => toast({ title: "Erro ao salvar onboarding", description: e.message, variant: "destructive" }),
  });

  const setEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (override) {
        const { error } = await supabase.from("onboarding_project_overrides").update({ is_enabled: enabled }).eq("id", override.id);
        if (error) throw error;
      } else {
        // Sem override ainda: cria um com a cópia do template pra poder desligar.
        const { error } = await supabase.from("onboarding_project_overrides").upsert(
          {
            project_id: projectId!,
            user_id: user!.id,
            source_template_id: templateQuery.template?.id ?? null,
            is_enabled: enabled,
            sections_json: templateSections as unknown as never,
          } as never,
          { onConflict: "project_id" },
        );
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  /** Volta a obra a seguir o template padrão ao vivo (apaga o override). */
  const resetToTemplate = useMutation({
    mutationFn: async () => {
      if (!override) return;
      const { error } = await supabase.from("onboarding_project_overrides").delete().eq("id", override.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: "Obra voltou a usar o template padrão" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return {
    override,
    overrideSections,
    templateSections,
    template: templateQuery.template,
    effectiveSections,
    usesTemplate,
    isEnabled,
    isLoading: query.isLoading || templateQuery.isLoading,
    isFetched: query.isFetched && templateQuery.isFetched,
    dataUpdatedAt: Math.max(query.dataUpdatedAt, templateQuery.dataUpdatedAt),
    saveOverride,
    setEnabled,
    resetToTemplate,
  };
}
