import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ConstructionTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
}

const statusOptions = [
  { value: "planejado", label: "Planejado" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "executado", label: "Executado" },
  { value: "atrasado", label: "Atrasado" },
];

export function ConstructionTaskForm({ open, onOpenChange, onSubmit, initialData, isLoading }: ConstructionTaskFormProps) {
  const [taskName, setTaskName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [status, setStatus] = useState("planejado");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [discipline, setDiscipline] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setTaskName((initialData?.task_name as string) || "");
      setSupplierName((initialData?.supplier_name as string) || "");
      setStatus((initialData?.status as string) || "planejado");
      setStartDate((initialData?.start_date as string) || "");
      setEndDate((initialData?.end_date as string) || "");
      setProgress(Number(initialData?.progress_percentage) || 0);
      setDiscipline((initialData?.discipline as string) || "");
      setNotes((initialData?.payment_note as string) || "");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      task_name: taskName,
      supplier_name: supplierName || null,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      progress_percentage: progress,
      discipline: discipline || null,
      payment_note: notes || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskName">Nome da Tarefa *</Label>
            <Input id="taskName" value={taskName} onChange={(e) => setTaskName(e.target.value)} required placeholder="Ex: Alvenaria do pavimento térreo" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierName">Responsável / Fornecedor</Label>
            <Input id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Ex: João Silva" />
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
            <Label htmlFor="discipline">Disciplina</Label>
            <Input id="discipline" value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Ex: Elétrica, Hidráulica" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações sobre a tarefa..." rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
