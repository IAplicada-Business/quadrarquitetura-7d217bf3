import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, Sparkles, Undo2 } from "lucide-react";
import { useOnboardingTemplate } from "@/hooks/useOnboardingTemplate";
import { OnboardingSectionsEditor } from "@/components/onboarding/OnboardingSectionsEditor";
import { sectionsEqual, starterSections, type OnboardingSection } from "@/lib/onboarding";

/** Configurações → Onboarding: template padrão do time. */
export default function OnboardingTemplateTab() {
  const { sections, isLoading, isFetched, dataUpdatedAt, save } = useOnboardingTemplate();
  const [draft, setDraft] = useState<OnboardingSection[] | null>(null);
  const dirtyRef = useRef(false);

  const dirty = draft != null && !sectionsEqual(draft, sections);
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!isFetched) return;
    if (draft == null || !dirtyRef.current) setDraft(sections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, isFetched, dataUpdatedAt]);

  if (isLoading || !draft) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 border-b">
        <div>
          <h3 className="font-semibold">Onboarding do cliente: template padrão</h3>
          <p className="text-xs text-muted-foreground">
            Toda obra nova nasce com estas seções. Cada obra pode personalizar a própria cópia na aba Onboarding do projeto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Alterações não salvas</Badge>}
          <Button size="sm" variant="ghost" onClick={() => setDraft(sections)} disabled={!dirty || save.isPending}>
            <Undo2 className="h-4 w-4 mr-1" /> Descartar
          </Button>
          <Button size="sm" onClick={() => save.mutate(draft)} disabled={!dirty || save.isPending}>
            <Save className="h-4 w-4 mr-1" /> {save.isPending ? "Salvando…" : "Salvar template"}
          </Button>
        </div>
      </div>

      {draft.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">O template ainda está vazio.</p>
          <Button size="sm" variant="outline" onClick={() => setDraft(starterSections())}>
            <Sparkles className="h-4 w-4 mr-1" /> Começar com a sugestão do mockup (capa + 3 passos)
          </Button>
        </div>
      )}

      <OnboardingSectionsEditor sections={draft} onChange={setDraft} uploadFolder="template" disabled={save.isPending} />
    </div>
  );
}
