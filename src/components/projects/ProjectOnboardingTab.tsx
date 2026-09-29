import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Copy, ExternalLink, Layers, RotateCcw, Save, Undo2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useProjectOnboarding } from "@/hooks/useProjectOnboarding";
import { useClientPortalToken } from "@/hooks/useClientPortalToken";
import { OnboardingSectionsEditor } from "@/components/onboarding/OnboardingSectionsEditor";
import { cloneSectionsForProject, sectionsEqual, type OnboardingSection } from "@/lib/onboarding";

interface Props {
  projectId: string;
  projectName?: string;
}

/**
 * Aba Onboarding da obra. Sem personalização, a obra segue o template
 * padrão ao vivo; ao salvar qualquer mudança, a obra ganha a própria
 * cópia (override) e deixa de ser afetada pelo template.
 */
export function ProjectOnboardingTab({ projectId, projectName }: Props) {
  const {
    effectiveSections, templateSections, usesTemplate, isEnabled,
    isLoading, isFetched, dataUpdatedAt, saveOverride, setEnabled, resetToTemplate,
  } = useProjectOnboarding(projectId);
  const { activeToken } = useClientPortalToken(projectId);

  // Rascunho: quando a obra ainda segue o template, o rascunho é uma cópia
  // com ids novos (é o que vira override ao salvar).
  const baseline = useMemo(
    () => (usesTemplate ? cloneSectionsForProject(effectiveSections) : effectiveSections),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveSections, usesTemplate, dataUpdatedAt],
  );
  const [draft, setDraft] = useState<OnboardingSection[] | null>(null);
  const [pulledFromTemplate, setPulledFromTemplate] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const dirtyRef = useRef(false);

  const dirty = draft != null && (pulledFromTemplate || !sectionsEqual(draft, baseline));
  dirtyRef.current = dirty;

  useEffect(() => {
    if (!isFetched) return;
    if (draft == null || !dirtyRef.current) {
      setDraft(baseline);
      setPulledFromTemplate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseline, isFetched]);

  const portalUrl = activeToken?.token ? `${window.location.origin}/client/${activeToken.token}` : null;

  if (isLoading || !draft) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const pullFromTemplate = () => {
    setDraft(cloneSectionsForProject(templateSections));
    setPulledFromTemplate(true);
  };

  const handleSave = () => {
    saveOverride.mutate({ sections: draft }, { onSuccess: () => setPulledFromTemplate(false) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            Onboarding do cliente
            {usesTemplate ? (
              <Badge variant="secondary" className="text-[10px]"><Layers className="h-3 w-3 mr-1" /> Usando template padrão</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Personalizado para esta obra</Badge>
            )}
          </h3>
          <p className="text-xs text-muted-foreground">
            {usesTemplate
              ? "Esta obra mostra o template padrão. Ao salvar qualquer alteração aqui, ela ganha a própria versão e o template não muda."
              : "Alterações aqui valem só para esta obra. O template padrão continua igual."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Switch checked={isEnabled} aria-label="Mostrar onboarding no portal desta obra" onCheckedChange={(v) => setEnabled.mutate(v)} disabled={setEnabled.isPending} />
            Visível no portal
          </label>
          {portalUrl && (
            <>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(portalUrl); toast({ title: "Link do portal copiado" }); }}>
                <Copy className="h-4 w-4 mr-1" /> Copiar link do portal
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={portalUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-1" /> Abrir portal</a>
              </Button>
            </>
          )}
        </div>
      </div>

      {!portalUrl && (
        <p className="text-xs text-muted-foreground rounded-md border border-dashed p-3">
          Esta obra ainda não tem link do portal do cliente. Gere o link na aba Acompanhamento para o cliente acessar o onboarding.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 border-b">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={pullFromTemplate} disabled={saveOverride.isPending} title="Substitui o rascunho pelas seções do template padrão para você customizar em cima">
            <Layers className="h-4 w-4 mr-1" /> Usar template padrão
          </Button>
          {!usesTemplate && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)} disabled={resetToTemplate.isPending}>
              <RotateCcw className="h-4 w-4 mr-1" /> Voltar a seguir o template
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Alterações não salvas</Badge>}
          <Button size="sm" variant="ghost" onClick={() => { setDraft(baseline); setPulledFromTemplate(false); }} disabled={!dirty || saveOverride.isPending}>
            <Undo2 className="h-4 w-4 mr-1" /> Descartar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty || saveOverride.isPending}>
            <Save className="h-4 w-4 mr-1" /> {saveOverride.isPending ? "Salvando…" : "Salvar para esta obra"}
          </Button>
        </div>
      </div>

      {draft.length === 0 && templateSections.length === 0 && (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-6 text-center">
          Nenhuma seção ainda. Monte o template padrão em Configurações → Onboarding, ou adicione seções só para esta obra.
        </p>
      )}

      <OnboardingSectionsEditor sections={draft} onChange={setDraft} uploadFolder={projectId} disabled={saveOverride.isPending} previewHeading={projectName} />

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voltar a seguir o template padrão?</AlertDialogTitle>
            <AlertDialogDescription>
              A personalização desta obra será apagada e o portal passará a mostrar o template padrão, inclusive mudanças futuras nele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmReset(false); resetToTemplate.mutate(); }}>Voltar ao template</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
