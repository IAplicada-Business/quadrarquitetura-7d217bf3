import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Wand2 } from "lucide-react";
import { ProjectActivity, computeCascade, CascadeChange } from "@/hooks/useProjectActivities";
import { CascadePreviewDialog } from "./CascadePreviewDialog";
import { getPrerequisitePreview, createPrerequisiteTasks, MEDICAO_ANCHORED_DISCIPLINES } from "@/lib/prerequisiteTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<ProjectActivity>) => void | Promise<void>;
  onCascade?: (changes: { id: string; start_date: string; end_date: string }[]) => void;
  initialData?: Partial<ProjectActivity> | null;
  allActivities: ProjectActivity[];
  projectId?: string;
  isLoading?: boolean;
}

export function ActivityForm({ open, onOpenChange, onSubmit, onCascade, initialData, allActivities, projectId, isLoading }: ActivityFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [medicaoDate, setMedicaoDate] = useState("");
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [status, setStatus] = useState("pendente");
  const [progressPercent, setProgressPercent] = useState("0");
  const [cascadeChanges, setCascadeChanges] = useState<CascadeChange[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState<Partial<ProjectActivity> | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setAreaM2(initialData.area_m2?.toString() || "");
      setDurationDays(initialData.duration_days?.toString() || "");
      setStartDate(initialData.start_date || "");
      setDiscipline(initialData.discipline || "");
      setMedicaoDate((initialData as any).medicao_date || "");
      setDependsOn(initialData.depends_on || []);
      setStatus(initialData.status || "pendente");
      setProgressPercent(initialData.progress_percent?.toString() || "0");
    } else {
      setName(""); setDescription(""); setAreaM2(""); setDurationDays("");
      setStartDate(""); setDiscipline(""); setMedicaoDate(""); setDependsOn([]); setStatus("pendente");
      setProgressPercent("0");
    }
  }, [initialData, open]);

  const handleSubmit = async () => {
    if (!name.trim() || isLoading) return;
    const dur = durationDays ? parseInt(durationDays) : null;
    let endDate: string | null = null;
    if (startDate && dur && dur > 0) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + dur);
      endDate = d.toISOString().split("T")[0];
    }
    const payload: Partial<ProjectActivity> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      description: description || null,
      area_m2: areaM2 ? parseFloat(areaM2) : null,
      duration_days: dur,
      start_date: startDate || null,
      end_date: endDate,
      medicao_date: medicaoDate || null,
      discipline: discipline || null,
      depends_on: dependsOn,
      status,
      progress_percent: parseInt(progressPercent) || 0,
    };

    // Check for cascade impact if editing and end_date changed
    if (initialData?.id && endDate && onCascade) {
      const oldEndDate = initialData.end_date;
      if (oldEndDate && endDate !== oldEndDate) {
        const changes = computeCascade(initialData.id, endDate, allActivities);
        if (changes.length > 0) {
          setPendingSubmit(payload);
          setCascadeChanges(changes);
          return;
        }
      }
    }

    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch {
      // Toast no hook; mantém formulário aberto.
    }
  };

  const handleCascadeConfirm = async () => {
    if (pendingSubmit) {
      try {
        await onSubmit(pendingSubmit);
        if (onCascade) {
          onCascade(cascadeChanges.map(c => ({ id: c.id, start_date: c.newStart, end_date: c.newEnd })));
        }
        setCascadeChanges([]);
        setPendingSubmit(null);
        onOpenChange(false);
      } catch {
        // Mantém preview aberto em caso de erro.
      }
      return;
    }
    setCascadeChanges([]);
    setPendingSubmit(null);
    onOpenChange(false);
  };

  const otherActivities = allActivities.filter(a => a.id !== initialData?.id);

  const toggleDep = (id: string) => {
    setDependsOn(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{initialData?.id ? "Editar Atividade" : "Nova Atividade"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Alvenaria térreo" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Área (m²)</Label>
                <Input type="number" value={areaM2} onChange={e => setAreaM2(e.target.value)} />
              </div>
              <div>
                <Label>Duração (dias)</Label>
                <Input type="number" value={durationDays} onChange={e => setDurationDays(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Início</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Disciplina *</Label>
                <Input value={discipline} onChange={e => setDiscipline(e.target.value)} placeholder="Ex: Elétrica" required />
              </div>
            </div>
            {MEDICAO_ANCHORED_DISCIPLINES.has(discipline) && (
              <div>
                <Label>
                  Data de Medição
                  <span className="ml-1 text-[11px] text-muted-foreground font-normal">
                    — quando preenchida, recalcula os pré-requisitos
                  </span>
                </Label>
                <Input
                  type="date"
                  value={medicaoDate}
                  onChange={e => setMedicaoDate(e.target.value)}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="bloqueada">Bloqueada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Progresso (%)</Label>
                <Input type="number" min={0} max={100} value={progressPercent} onChange={e => setProgressPercent(e.target.value)} />
              </div>
            </div>
            {otherActivities.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Dependências</Label>
                  {/* Sprint 7d (call 28:00): "ele considerou um tanto de
                      dependência que eu não consigo tirar". Botão pra
                      limpar todas em um clique quando a IA exagera. */}
                  {dependsOn.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDependsOn([])}
                      className="text-[11px] text-muted-foreground hover:text-destructive underline underline-offset-2"
                    >
                      Limpar {dependsOn.length}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1 max-h-24 overflow-y-auto border rounded-md p-2">
                  {otherActivities.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleDep(a.id)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                        dependsOn.includes(a.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:bg-accent"
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vídeo 13: cadeia automática "medir → orçar → comprar →
                instalar" só faz sentido para disciplinas de fabricação.
                Mostra preview e botão "Gerar pré-requisitos" só se
                houver blueprint para a disciplina escolhida. */}
            {(() => {
              const preview = getPrerequisitePreview({
                id: initialData?.id,
                name: name || initialData?.name || "",
                discipline,
                start_date: startDate || initialData?.start_date,
                medicao_date: medicaoDate || (initialData as any)?.medicao_date || null,
              });
              if (preview.length === 0) return null;
              return (
                <div className="rounded-md border p-3 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ListChecks className="h-4 w-4" />
                    Pré-requisitos para {discipline}
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {preview.map((p, i) => (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span>{p.title}</span>
                        {p.due_date && (
                          <Badge variant="outline" className="text-[10px]">
                            {new Date(p.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!user || !projectId) return;
                      try {
                        const created = await createPrerequisiteTasks({
                          activity: {
                            id: initialData?.id,
                            name: name || initialData?.name || "",
                            discipline,
                            start_date: startDate || initialData?.start_date,
                            medicao_date: medicaoDate || (initialData as any)?.medicao_date || null,
                          },
                          projectId,
                          userId: user.id,
                        });
                        queryClient.invalidateQueries({ queryKey: ["voice_tasks"] });
                        toast({
                          title: `${created} tarefa(s) Quadra criada(s)`,
                          description: "Veja em Tarefas Quadra (kanban).",
                        });
                      } catch (e: any) {
                        toast({ title: "Erro", description: e.message, variant: "destructive" });
                      }
                    }}
                    disabled={!projectId || !user || !name.trim()}
                    className="w-full"
                  >
                    <Wand2 className="h-3.5 w-3.5 mr-1" />
                    Gerar pré-requisitos como Tarefas Quadra
                  </Button>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || !discipline.trim() || isLoading}>
              {initialData?.id ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CascadePreviewDialog
        open={cascadeChanges.length > 0}
        onOpenChange={(open) => { if (!open) { setCascadeChanges([]); setPendingSubmit(null); } }}
        changes={cascadeChanges}
        onConfirm={handleCascadeConfirm}
        isLoading={isLoading}
      />
    </>
  );
}
