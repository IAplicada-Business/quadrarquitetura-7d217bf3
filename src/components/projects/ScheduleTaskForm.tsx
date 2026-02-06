import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ScheduleTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    task_name: string;
    scope_item_id?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    payment_note?: string;
    order_index?: number;
  }) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
  scopeItems?: { id: string; discipline: string }[];
}

export function ScheduleTaskForm({ open, onOpenChange, onSubmit, initialData, isLoading, scopeItems = [] }: ScheduleTaskFormProps) {
  const [taskName, setTaskName] = useState(initialData?.task_name as string || "");
  const [scopeItemId, setScopeItemId] = useState(initialData?.scope_item_id as string || "");
  const [startDate, setStartDate] = useState(initialData?.start_date as string || "");
  const [endDate, setEndDate] = useState(initialData?.end_date as string || "");
  const [status, setStatus] = useState(initialData?.status as string || "planejado");
  const [paymentNote, setPaymentNote] = useState(initialData?.payment_note as string || "");
  const [orderIndex, setOrderIndex] = useState(initialData?.order_index ? String(initialData.order_index) : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName) return;
    onSubmit({
      task_name: taskName,
      scope_item_id: scopeItemId || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status,
      payment_note: paymentNote || undefined,
      order_index: orderIndex ? Number(orderIndex) : undefined,
    });
    onOpenChange(false);
    setTaskName(""); setScopeItemId(""); setStartDate(""); setEndDate("");
    setStatus("planejado"); setPaymentNote(""); setOrderIndex("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-display">
            {initialData ? "Editar Etapa" : "Nova Etapa"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome da Etapa</Label>
            <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="Ex: Demolição, Instalação elétrica..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Disciplina</Label>
              <Select value={scopeItemId} onValueChange={setScopeItemId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {scopeItems.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.discipline}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordem</Label>
              <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} placeholder="1, 2, 3..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planejado">Planejado</SelectItem>
                  <SelectItem value="em_execucao">Em Execução</SelectItem>
                  <SelectItem value="executado">Executado</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nota de Pagamento</Label>
              <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Ex: PAGAMENTO 50%" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{initialData ? "Salvar" : "Adicionar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
