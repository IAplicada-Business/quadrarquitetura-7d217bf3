import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

interface ScheduleTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    task_name: string;
    scope_item_id?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: string;
    payment_note?: string | null;
    order_index?: number;
    supplier_name?: string | null;
    discipline?: string | null;
    is_client_visible?: boolean;
    is_daily_detail?: boolean;
    requires_presence?: boolean;
    progress_percentage?: number;
    color?: string;
  }) => void | Promise<void>;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
  scopeItems?: { id: string; discipline: string }[];
}

const COLORS = [
  { value: "#3b82f6", label: "Azul" },
  { value: "#10b981", label: "Verde" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#06b6d4", label: "Ciano" },
  { value: "#f97316", label: "Laranja" },
];

export function ScheduleTaskForm({ open, onOpenChange, onSubmit, initialData, isLoading, scopeItems = [] }: ScheduleTaskFormProps) {
  const [taskName, setTaskName] = useState(initialData?.task_name as string || "");
  const [scopeItemId, setScopeItemId] = useState(initialData?.scope_item_id as string || "");
  const [startDate, setStartDate] = useState(initialData?.start_date as string || "");
  const [endDate, setEndDate] = useState(initialData?.end_date as string || "");
  const [status, setStatus] = useState(initialData?.status as string || "planejado");
  const [paymentNote, setPaymentNote] = useState(initialData?.payment_note as string || "");
  const [orderIndex, setOrderIndex] = useState(initialData?.order_index ? String(initialData.order_index) : "");
  const [supplierName, setSupplierName] = useState(initialData?.supplier_name as string || "");
  const [discipline, setDiscipline] = useState(initialData?.discipline as string || "");
  const [isClientVisible, setIsClientVisible] = useState(initialData?.is_client_visible !== false);
  const [isDailyDetail, setIsDailyDetail] = useState(!!initialData?.is_daily_detail);
  const [requiresPresence, setRequiresPresence] = useState(!!initialData?.requires_presence);
  const [progress, setProgress] = useState(Number(initialData?.progress_percentage) || 0);
  const [color, setColor] = useState(initialData?.color as string || "#3b82f6");

  useEffect(() => {
    if (open) {
      setTaskName(initialData?.task_name as string || "");
      setScopeItemId(initialData?.scope_item_id as string || "");
      setStartDate(initialData?.start_date as string || "");
      setEndDate(initialData?.end_date as string || "");
      setStatus(initialData?.status as string || "planejado");
      setPaymentNote(initialData?.payment_note as string || "");
      setOrderIndex(initialData?.order_index ? String(initialData.order_index) : "");
      setSupplierName(initialData?.supplier_name as string || "");
      setDiscipline(initialData?.discipline as string || "");
      setIsClientVisible(initialData?.is_client_visible !== false);
      setIsDailyDetail(!!initialData?.is_daily_detail);
      setRequiresPresence(!!initialData?.requires_presence);
      setProgress(Number(initialData?.progress_percentage) || 0);
      setColor(initialData?.color as string || "#3b82f6");
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || isLoading) return;
    try {
      await onSubmit({
        task_name: taskName,
        scope_item_id: scopeItemId || null,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
        payment_note: paymentNote || null,
        order_index: orderIndex ? Number(orderIndex) : undefined,
        supplier_name: supplierName || null,
        discipline: discipline || null,
        is_client_visible: isClientVisible,
        is_daily_detail: isDailyDetail,
        requires_presence: requiresPresence,
        progress_percentage: progress,
        color,
      });
      onOpenChange(false);
      setTaskName(""); setScopeItemId(""); setStartDate(""); setEndDate("");
      setStatus("planejado"); setPaymentNote(""); setOrderIndex("");
      setSupplierName(""); setDiscipline(""); setIsClientVisible(true);
      setIsDailyDetail(false); setRequiresPresence(false); setProgress(0); setColor("#3b82f6");
    } catch {
      // Erro tratado no hook (toast). Mantém formulário aberto.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <Label>Disciplina (Escopo)</Label>
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
              <Label>Disciplina (texto)</Label>
              <Input value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Ex: Elétrica" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fornecedor/Responsável</Label>
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nome" />
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
                  <SelectItem value="pendencia">Pendência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.value }} />
                        {c.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Progresso ({progress}%)</Label>
            <Slider value={[progress]} onValueChange={([v]) => setProgress(v)} min={0} max={100} step={5} className="mt-2" />
          </div>
          <div>
            <Label>Nota de Pagamento</Label>
            <Input value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="Ex: PAGAMENTO 50%" />
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isClientVisible} onCheckedChange={(v) => setIsClientVisible(!!v)} />
              Visível para cliente
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isDailyDetail} onCheckedChange={(v) => setIsDailyDetail(!!v)} />
              Detalhe diário
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={requiresPresence} onCheckedChange={(v) => setRequiresPresence(!!v)} />
              Requer presença
            </label>
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
