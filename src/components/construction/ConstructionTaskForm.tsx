import { useState, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface ConstructionTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
  projects: Project[];
  parentTask?: { id: string; project_id: string; task_name: string } | null;
}

const statusOptions = [
  { value: "planejado", label: "Planejado" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "executado", label: "Executado" },
  { value: "atrasado", label: "Atrasado" },
];

const taskTypeOptions = [
  "Alvenaria",
  "Elétrica",
  "Hidráulica",
  "Pintura",
  "Acabamento",
  "Demolição",
  "Estrutura",
  "Impermeabilização",
  "Esquadrias",
  "Outros",
];

export function ConstructionTaskForm({ open, onOpenChange, onSubmit, initialData, isLoading, projects, parentTask }: ConstructionTaskFormProps) {
  const [projectId, setProjectId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [responsibles, setResponsibles] = useState<string[]>([]);
  const [responsibleInput, setResponsibleInput] = useState("");
  const [status, setStatus] = useState("planejado");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [taskType, setTaskType] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setProjectId(parentTask?.project_id || (initialData?.project_id as string) || "");
      setTaskName((initialData?.task_name as string) || "");
      const supplierStr = (initialData?.supplier_name as string) || "";
      setResponsibles(supplierStr ? supplierStr.split(",").map((s) => s.trim()).filter(Boolean) : []);
      setResponsibleInput("");
      setStatus((initialData?.status as string) || "planejado");
      setStartDate((initialData?.start_date as string) || "");
      setEndDate((initialData?.end_date as string) || "");
      setProgress(Number(initialData?.progress_percentage) || 0);
      setTaskType((initialData?.discipline as string) || "");
      setNotes((initialData?.payment_note as string) || "");
    }
  }, [initialData, open, parentTask]);

  const addResponsible = () => {
    const name = responsibleInput.trim();
    if (name && !responsibles.includes(name)) {
      setResponsibles([...responsibles, name]);
    }
    setResponsibleInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addResponsible();
    }
  };

  const removeResponsible = (name: string) => {
    setResponsibles(responsibles.filter((r) => r !== name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      project_id: parentTask?.project_id || projectId,
      task_name: taskName,
      supplier_name: responsibles.join(", ") || null,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      progress_percentage: progress,
      discipline: taskType || null,
      payment_note: notes || null,
    };
    if (parentTask && !initialData) {
      data.parent_id = parentTask.id;
    }
    onSubmit(data);
    onOpenChange(false);
  };

  const isSubtask = !!parentTask;
  const dialogTitle = initialData
    ? (isSubtask ? "Editar Subtarefa" : "Editar Tarefa")
    : (isSubtask ? "Nova Subtarefa" : "Nova Tarefa");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {isSubtask && !initialData && (
            <p className="text-sm text-muted-foreground">
              Subtarefa de: <span className="font-medium">{parentTask.task_name}</span>
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSubtask && (
            <div className="space-y-2">
              <Label>Projeto *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="taskName">Nome da {isSubtask ? "Subtarefa" : "Tarefa"} *</Label>
            <Input id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} required placeholder={isSubtask ? "Ex: Levantar parede sala" : "Ex: Alvenaria do pavimento térreo"} />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Tarefa</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                {taskTypeOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Responsáveis</Label>
            <div className="flex gap-2">
              <Input
                value={responsibleInput}
                onChange={(e) => setResponsibleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite e pressione Enter"
                className="flex-1"
              />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Progresso: {progress}%</Label>
            <Slider value={[progress]} onValueChange={(v) => setProgress(v[0])} max={100} step={5} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações sobre a tarefa..." rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || (!isSubtask && !projectId)}>{isLoading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
