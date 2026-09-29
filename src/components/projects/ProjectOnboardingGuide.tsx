import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Circle, ArrowRight, PartyPopper } from "lucide-react";
import { useProjectActivities } from "@/hooks/useProjectActivities";
import { useMaterialTracking } from "@/hooks/useMaterialTracking";
import { usePriceResearch } from "@/hooks/usePriceResearch";
import { useClientClosingSchedule } from "@/hooks/useClientClosingSchedule";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  description: string;
  tab: string;
  completed: boolean;
}

interface ProjectOnboardingGuideProps {
  project: Record<string, unknown>;
  onTabChange?: (tab: string) => void;
  onDismiss: () => void;
}

export function ProjectOnboardingGuide({ project, onTabChange, onDismiss }: ProjectOnboardingGuideProps) {
  const projectId = project.id as string;
  const { activities } = useProjectActivities(projectId);
  const { items: materials } = useMaterialTracking(projectId);
  const { research } = usePriceResearch(projectId);
  const { items: closingItems } = useClientClosingSchedule(projectId);

  const [celebrating, setCelebrating] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Espelha o fluxo das abas da obra: Escopo gera as atividades; em
  // Cronograma, o Cronograma Reverso é a base (Gantt e Contagem
  // Regressiva saem dele) e o checklist de entrega fica em cada
  // atividade; Fechamento Cliente lista o que o cliente precisa fechar.
  const steps: Step[] = [
    {
      label: "Importar dados da proposta",
      description: "Vincule a proposta aprovada ao projeto",
      tab: "orcamentos",
      completed: !!(project.source_proposal_id && project.cotacao_importada === true),
    },
    {
      label: "Gerar atividades da obra",
      description: "Crie as atividades no Escopo (IA ou manual). Elas alimentam todo o cronograma.",
      tab: "escopo",
      completed: activities.length > 0,
    },
    {
      label: "Verificar materiais calculados",
      description: "Confira os materiais necessários para cada atividade",
      tab: "materiais",
      completed: materials.length > 0,
    },
    {
      label: "Pesquisar preços em BH",
      description: "Atualize os preços de referência dos materiais",
      tab: "orcamentos",
      completed: research.length > 0,
    },
    {
      label: "Aprovar cotação",
      description: "Revise e aprove o cenário de cotação final",
      tab: "orcamentos",
      completed: project.cotacao_aprovada === true,
    },
    {
      label: "Montar o Cronograma Reverso",
      description: "Em Cronograma, aplique o calendário BR às atividades. O Gantt e a Contagem Regressiva saem daí; o checklist de entrega fica em cada atividade.",
      tab: "cronograma",
      completed: activities.some((a) => !!a.start_date),
    },
    {
      label: "Cadastrar o fechamento do cliente",
      description: "Em Cronograma → Fechamento Cliente, liste o que o cliente precisa fechar e até quando (marcenaria, mármores, eletros).",
      tab: "cronograma",
      completed: closingItems.length > 0,
    },
  ];

  const allCompleted = steps.every((s) => s.completed);
  const firstPendingIndex = steps.findIndex((s) => !s.completed);

  useEffect(() => {
    if (allCompleted && !celebrating) {
      setCelebrating(true);
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allCompleted]);

  if (celebrating) {
    return (
      <Card className="border-primary/30 bg-primary/5 animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
          <PartyPopper className="h-12 w-12 text-primary animate-bounce" />
          <p className="text-xl font-bold text-display">Projeto configurado com sucesso!</p>
          <p className="text-sm text-muted-foreground">Todos os passos iniciais foram concluídos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-background animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-display">
             Próximos Passos
          </CardTitle>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <Checkbox
                checked={dontShowAgain}
                onCheckedChange={(v) => setDontShowAgain(!!v)}
              />
              Não mostrar novamente
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (dontShowAgain) {
                  onDismiss();
                } else {
                  onDismiss();
                }
              }}
            >
              Ocultar guia
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-4">
            {steps.map((step, i) => {
              const isCurrent = i === firstPendingIndex;
              const isFuture = !step.completed && i > firstPendingIndex;

              return (
                <div
                  key={i}
                  className={cn(
                    "relative flex items-start gap-3 rounded-lg p-3 transition-all",
                    step.completed && "opacity-60",
                    isCurrent && "border border-primary/30 bg-primary/5",
                    isFuture && "opacity-40"
                  )}
                >
                  {/* Icon */}
                  <div className="absolute -left-8 top-3 z-10 flex items-center justify-center">
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
                    ) : isCurrent ? (
                      <div className="animate-pulse">
                        <Circle className="h-5 w-5 text-primary fill-primary/20" />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      step.completed && "line-through decoration-muted-foreground/50"
                    )}>
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>

                  {isCurrent && (
                    <Button
                      size="sm"
                      variant="default"
                      className="shrink-0"
                      onClick={() => onTabChange?.(step.tab)}
                    >
                      Ir para
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
