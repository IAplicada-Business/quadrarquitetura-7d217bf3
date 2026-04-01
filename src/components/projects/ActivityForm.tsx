import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectActivity, computeCascade, CascadeChange } from "@/hooks/useProjectActivities";
import { CascadePreviewDialog } from "./CascadePreviewDialog";

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<ProjectActivity>) => void;
  onCascade?: (changes: { id: string; start_date: string; end_date: string }[]) => void;
  initialData?: Partial<ProjectActivity> | null;
  allActivities: ProjectActivity[];
  isLoading?: boolean;
}

export function ActivityForm({ open, onOpenChange, onSubmit, onCascade, initialData, allActivities, isLoading }: ActivityFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [discipline, setDiscipline] = useState("");
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
      setDependsOn(initialData.depends_on || []);
      setStatus(initialData.status || "pendente");
      setProgressPercent(initialData.progress_percent?.toString() || "0");
    } else {
      setName(""); setDescription(""); setAreaM2(""); setDurationDays("");
      setStartDate(""); setDiscipline(""); setDependsOn([]); setStatus("pendente");
      setProgressPercent("0");
    }
  }, [initialData, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
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

    onSubmit(payload);
    onOpenChange(false);
  };

  const handleCascadeConfirm = () => {
    if (pendingSubmit) {
      onSubmit(pendingSubmit);
      if (onCascade) {
        onCascade(cascadeChanges.map(c => ({ id: c.id, start_date: c.newStart, end_date: c.newEnd })));
      }
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
                <Label>Disciplina</Label>
                <Input value={discipline} onChange={e => setDiscipline(e.target.value)} placeholder="Ex: Elétrica" />
              </div>
            </div>
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
                <Label>Dependências</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isLoading}>
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
