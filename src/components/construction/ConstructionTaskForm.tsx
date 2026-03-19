import { useState, useEffect, useMemo, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { X, Plus, ChevronDown, ChevronRight, Trash2, Settings } from "lucide-react";
import { addDays, format, parseISO } from "date-fns";

interface Project {
  id: string;
  name: string;
}

interface TaskItem {
  id: string;
  task_name: string;
  end_date?: string | null;
  parent_id?: string | null;
}

interface MaterialItem {
  name: string;
  quantity: number | string;
  unit: string;
  status: string;
}

interface ConstructionTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
  projects: Project[];
  parentTask?: { id: string; project_id: string; task_name: string } | null;
  allTasks?: TaskItem[];
}

const statusOptions = [
  { value: "planejado", label: "Planejado" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "executado", label: "Executado" },
  { value: "atrasado", label: "Atrasado" },
  { value: "pendencia", label: "Pendência" },
];

const disciplineOptions = [
  "Alvenaria", "Elétrica", "Hidráulica", "Pintura", "Acabamento",
  "Demolição", "Estrutura", "Impermeabilização", "Esquadrias",
  "Automação", "Ar-condicionado", "Gesso/Forro", "Revestimento",
  "Marcenaria", "Piso", "Outros",
];

export function ConstructionTaskForm({
  open, onOpenChange, onSubmit, initialData, isLoading, projects, parentTask, allTasks = [],
}: ConstructionTaskFormProps) {
  const [projectId, setProjectId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [environment, setEnvironment] = useState("");
  const [responsibles, setResponsibles] = useState<string[]>([]);
  const [responsibleInput, setResponsibleInput] = useState("");
  const [estimatedDays, setEstimatedDays] = useState<string>("");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("planejado");
  const [progress, setProgress] = useState(0);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isClientVisible, setIsClientVisible] = useState(false);
  const [isDailyDetail, setIsDailyDetail] = useState(false);
  const [requiresPresence, setRequiresPresence] = useState(false);
  const [color, setColor] = useState("");
  const [orderIndex, setOrderIndex] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setProjectId(parentTask?.project_id || (initialData?.project_id as string) || "");
      setTaskName((initialData?.task_name as string) || "");
      setDescription((initialData?.description as string) || "");
      setDiscipline((initialData?.discipline as string) || "");
      setEnvironment((initialData?.environment as string) || "");
      const supplierStr = (initialData?.supplier_name as string) || "";
      setResponsibles(supplierStr ? supplierStr.split(",").map((s) => s.trim()).filter(Boolean) : []);
      setResponsibleInput("");
      setEstimatedDays(initialData?.estimated_days != null ? String(initialData.estimated_days) : "");
      const deps = (initialData?.dependencies as string[]) || [];
      setDependencies(deps);
      setStartDate((initialData?.start_date as string) || "");
      setEndDate((initialData?.end_date as string) || "");
      setStatus((initialData?.status as string) || "planejado");
      setProgress(Number(initialData?.progress_percentage) || 0);
      const mats = (initialData?.materials as MaterialItem[]) || [];
      setMaterials(mats);
      setMaterialsOpen(mats.length > 0);
      setNotes((initialData?.payment_note as string) || "");
      setIsClientVisible(!!initialData?.is_client_visible);
      setIsDailyDetail(!!initialData?.is_daily_detail);
      setRequiresPresence(!!initialData?.requires_presence);
      setColor((initialData?.color as string) || "");
      setOrderIndex(initialData?.order_index != null ? String(initialData.order_index) : "");
      setScheduleOpen(!!initialData?.is_client_visible || !!initialData?.is_daily_detail || !!initialData?.requires_presence || !!(initialData?.color) || initialData?.order_index != null);
    }
  }, [initialData, open, parentTask]);

  // Auto-calculate dates
  const calculatedStartDate = useMemo(() => {
    if (startDate) return startDate;
    if (dependencies.length === 0) return "";
    const depTasks = allTasks.filter((t) => dependencies.includes(t.id) && t.end_date);
    if (depTasks.length === 0) return "";
    const maxEnd = depTasks.reduce((max, t) => {
      const d = t.end_date!;
      return d > max ? d : max;
    }, "");
    return format(addDays(parseISO(maxEnd), 1), "yyyy-MM-dd");
  }, [startDate, dependencies, allTasks]);

  const calculatedEndDate = useMemo(() => {
    if (endDate) return endDate;
    const start = calculatedStartDate;
    const days = parseInt(estimatedDays);
    if (!start || isNaN(days) || days <= 0) return "";
    return format(addDays(parseISO(start), days), "yyyy-MM-dd");
  }, [endDate, calculatedStartDate, estimatedDays]);

  // Available tasks for "Depende de" (same project, exclude self and subtasks)
  const availableDeps = useMemo(() => {
    const pid = parentTask?.project_id || projectId;
    if (!pid) return [];
    const currentId = initialData?.id as string | undefined;
    return allTasks.filter(
      (t) => t.id !== currentId && !t.parent_id
    );
  }, [allTasks, projectId, parentTask, initialData]);

  const toggleDependency = (taskId: string) => {
    setDependencies((prev) =>
      prev.includes(taskId) ? prev.filter((d) => d !== taskId) : [...prev, taskId]
    );
  };

  const addResponsible = () => {
    const name = responsibleInput.trim();
    if (name && !responsibles.includes(name)) {
      setResponsibles([...responsibles, name]);
    }
    setResponsibleInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); addResponsible(); }
  };

  const removeResponsible = (name: string) => {
    setResponsibles(responsibles.filter((r) => r !== name));
  };

  const addMaterial = () => {
    setMaterials([...materials, { name: "", quantity: "", unit: "", status: "necessario" }]);
  };

  const updateMaterial = (index: number, field: keyof MaterialItem, value: string) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStart = startDate || calculatedStartDate;
    const finalEnd = endDate || calculatedEndDate;
    const data: Record<string, unknown> = {
      project_id: parentTask?.project_id || projectId,
      task_name: taskName,
      description: description || null,
      discipline: discipline || null,
      environment: environment || null,
      supplier_name: responsibles.join(", ") || null,
      estimated_days: estimatedDays ? parseInt(estimatedDays) : null,
      dependencies: dependencies.length > 0 ? dependencies : [],
      start_date: finalStart || null,
      end_date: finalEnd || null,
      status,
      progress_percentage: progress,
      materials: materials.filter((m) => m.name.trim()),
      payment_note: notes || null,
      is_client_visible: isClientVisible,
      is_daily_detail: isDailyDetail,
      requires_presence: requiresPresence,
      color: color || null,
      order_index: orderIndex ? parseInt(orderIndex) : null,
    };
    if (parentTask && !initialData) {
      data.parent_id = parentTask.id;
    }
    onSubmit(data);
    onOpenChange(false);
  };

  const isSubtask = !!parentTask;
  const dialogTitle = initialData
    ? (isSubtask ? "Editar Subtarefa" : "Editar Atividade")
    : (isSubtask ? "Nova Subtarefa" : "Nova Atividade");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {isSubtask && !initialData && (
            <p className="text-sm text-muted-foreground">
              Subtarefa de: <span className="font-medium">{parentTask.task_name}</span>
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Projeto */}
          {!isSubtask && (
            <div className="space-y-2">
              <Label>Projeto/Obra *</Label>
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 2. Nome da Atividade */}
          <div className="space-y-2">
            <Label htmlFor="taskName">Nome da Atividade *</Label>
            <Input id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} required
              placeholder="Ex: Instalação de tomadas - Suíte Master" />
          </div>

          {/* 3. Descrição do Serviço */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Serviço</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhamento do que será executado..." rows={3} />
          </div>

          {/* 4. Disciplina */}
          <div className="space-y-2">
            <Label>Disciplina</Label>
            <Select value={discipline} onValueChange={setDiscipline}>
              <SelectTrigger><SelectValue placeholder="Selecione a disciplina" /></SelectTrigger>
              <SelectContent>
                {disciplineOptions.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 5. Ambiente */}
          <div className="space-y-2">
            <Label htmlFor="environment">Ambiente</Label>
            <Input id="environment" value={environment} onChange={(e) => setEnvironment(e.target.value)}
              placeholder="Ex: Suíte Master, Cozinha, Escada" />
          </div>

          {/* 6. Responsável/Fornecedor */}
          <div className="space-y-2">
            <Label>Responsável/Fornecedor</Label>
            <div className="flex gap-2">
              <Input value={responsibleInput} onChange={(e) => setResponsibleInput(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="Digite e pressione Enter" className="flex-1" />
              <Button type="button" variant="outline" size="sm" onClick={addResponsible} className="shrink-0">
                Adicionar
              </Button>
            </div>
            {responsibles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {responsibles.map((name) => (
                  <Badge key={name} variant="secondary" className="gap-1 pr-1">
                    {name}
                    <button type="button" onClick={() => removeResponsible(name)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 7. Prazo Estimado */}
          <div className="space-y-2">
            <Label htmlFor="estimatedDays">Prazo Estimado (dias)</Label>
            <Input id="estimatedDays" type="number" min="1" value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)} placeholder="Ex: 14" />
          </div>

          {/* 8. Depende de */}
          {availableDeps.length > 0 && (
            <div className="space-y-2">
              <Label>Depende de (Caminho Crítico)</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                {availableDeps.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                    <Checkbox
                      checked={dependencies.includes(t.id)}
                      onCheckedChange={() => toggleDependency(t.id)}
                    />
                    <span className="truncate">{t.task_name}</span>
                    {t.end_date && (
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        até {format(parseISO(t.end_date), "dd/MM")}
                      </span>
                    )}
                  </label>
                ))}
              </div>
              {calculatedStartDate && !startDate && (
                <p className="text-xs text-muted-foreground">
                  📅 Início calculado: {format(parseISO(calculatedStartDate), "dd/MM/yyyy")}
                </p>
              )}
            </div>
          )}

          {/* 9. Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                placeholder={calculatedStartDate || undefined} />
              {calculatedStartDate && !startDate && (
                <p className="text-xs text-muted-foreground">Auto: {format(parseISO(calculatedStartDate), "dd/MM/yyyy")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              {calculatedEndDate && !endDate && (
                <p className="text-xs text-muted-foreground">Auto: {format(parseISO(calculatedEndDate), "dd/MM/yyyy")}</p>
              )}
            </div>
          </div>

          {/* 10. Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 11. Progresso */}
          <div className="space-y-2">
            <Label>Progresso: {progress}%</Label>
            <Slider value={[progress]} onValueChange={(v) => setProgress(v[0])} max={100} step={5} />
          </div>

          {/* 12. Materiais Associados */}
          <Collapsible open={materialsOpen} onOpenChange={setMaterialsOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between px-2 h-9 text-sm font-medium">
                Materiais Associados ({materials.length})
                {materialsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {materials.map((mat, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input placeholder="Material" value={mat.name}
                    onChange={(e) => updateMaterial(i, "name", e.target.value)} className="flex-1" />
                  <Input placeholder="Qtd" type="number" value={mat.quantity}
                    onChange={(e) => updateMaterial(i, "quantity", e.target.value)} className="w-20" />
                  <Input placeholder="Un." value={mat.unit}
                    onChange={(e) => updateMaterial(i, "unit", e.target.value)} className="w-20" />
                  <Select value={mat.status || "necessario"} onValueChange={(v) => updateMaterial(i, "status", v)}>
                    <SelectTrigger className="w-28 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="necessario">Necessário</SelectItem>
                      <SelectItem value="comprado">Comprado</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="usado">Usado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-destructive"
                    onClick={() => removeMaterial(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addMaterial} className="w-full">
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Material
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {/* 12.5. Configurações do Cronograma */}
          <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full justify-between px-2 h-9 text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5" />
                  Configurações do Cronograma
                </span>
                {scheduleOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={isClientVisible} onCheckedChange={(v) => setIsClientVisible(!!v)} />
                Visível para o cliente
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={isDailyDetail} onCheckedChange={(v) => setIsDailyDetail(!!v)} />
                Detalhe diário
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={requiresPresence} onCheckedChange={(v) => setRequiresPresence(!!v)} />
                Requer presença na obra
              </label>
              <div className="space-y-2">
                <Label>Cor no Cronograma</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger><SelectValue placeholder="Cor automática (disciplina)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Automática</SelectItem>
                    {[
                      { value: "#3b82f6", label: "Azul" },
                      { value: "#ef4444", label: "Vermelho" },
                      { value: "#22c55e", label: "Verde" },
                      { value: "#f59e0b", label: "Amarelo" },
                      { value: "#8b5cf6", label: "Roxo" },
                      { value: "#ec4899", label: "Rosa" },
                      { value: "#06b6d4", label: "Ciano" },
                      { value: "#f97316", label: "Laranja" },
                    ].map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c.value }} />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderIndex">Ordem de Exibição</Label>
                <Input id="orderIndex" type="number" min="0" value={orderIndex}
                  onChange={(e) => setOrderIndex(e.target.value)} placeholder="Ex: 1, 2, 3..." />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a atividade..." rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || (!isSubtask && !projectId)}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
