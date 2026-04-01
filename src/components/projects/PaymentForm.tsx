import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addDays, format } from "date-fns";

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    value: number;
    description?: string;
    supplier_id?: string;
    due_date?: string;
    paid_date?: string;
    status?: "pendente" | "notificado" | "pago" | "atrasado";
    installment_number?: number;
    total_installments?: number;
    pix_key?: string;
  }) => void;
  onSubmitInstallments?: (data: {
    description?: string;
    totalValue: number;
    numParcelas: number;
    firstDate: string;
    intervalDays: number;
    pix_key?: string;
    status?: "pendente" | "notificado" | "pago" | "atrasado";
  }) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function PaymentForm({ open, onOpenChange, onSubmit, onSubmitInstallments, initialData, isLoading }: PaymentFormProps) {
  const [value, setValue] = useState(initialData?.value ? String(initialData.value) : "");
  const [description, setDescription] = useState(initialData?.description as string || "");
  const [dueDate, setDueDate] = useState(initialData?.due_date as string || "");
  const [paidDate, setPaidDate] = useState(initialData?.paid_date as string || "");
  const [status, setStatus] = useState(initialData?.status as string || "pendente");
  const [pixKey, setPixKey] = useState(initialData?.pix_key as string || "");

  // Installment state
  const [parcelar, setParcelar] = useState(false);
  const [numParcelas, setNumParcelas] = useState("3");
  const [firstDate, setFirstDate] = useState("");
  const [intervalo, setIntervalo] = useState("30");
  const [customDays, setCustomDays] = useState("30");

  const isEditing = !!initialData;

  const intervalDays = intervalo === "custom" ? Number(customDays) || 30 : Number(intervalo);

  const installmentPreview = useMemo(() => {
    if (!parcelar || !value || !firstDate || !numParcelas) return [];
    const total = Number(value);
    const n = Number(numParcelas);
    if (n < 1 || n > 24 || total <= 0) return [];
    const base = Math.floor((total / n) * 100) / 100;
    const last = Math.round((total - base * (n - 1)) * 100) / 100;
    return Array.from({ length: n }, (_, i) => ({
      num: i + 1,
      value: i === n - 1 ? last : base,
      date: addDays(new Date(firstDate), intervalDays * i),
    }));
  }, [parcelar, value, firstDate, numParcelas, intervalDays]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;

    if (parcelar && !isEditing && onSubmitInstallments) {
      onSubmitInstallments({
        description: description || undefined,
        totalValue: Number(value),
        numParcelas: Number(numParcelas),
        firstDate,
        intervalDays,
        pix_key: pixKey || undefined,
        status: status as "pendente" | "notificado" | "pago" | "atrasado",
      });
    } else {
      onSubmit({
        value: Number(value),
        description: description || undefined,
        due_date: dueDate || undefined,
        paid_date: paidDate || undefined,
        status: status as "pendente" | "notificado" | "pago" | "atrasado",
        pix_key: pixKey || undefined,
      });
    }
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setValue(""); setDescription(""); setDueDate(""); setPaidDate("");
    setStatus("pendente"); setPixKey("");
    setParcelar(false); setNumParcelas("3"); setFirstDate(""); setIntervalo("30"); setCustomDays("30");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-display">
            {isEditing ? "Editar Pagamento" : "Novo Pagamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Marcenaria - Parcela 1/3" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor Total (R$)</Label>
              <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="notificado">Notificado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Installment toggle - only for new payments */}
          {!isEditing && onSubmitInstallments && (
            <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50 border">
              <Switch checked={parcelar} onCheckedChange={setParcelar} />
              <Label className="cursor-pointer" onClick={() => setParcelar(!parcelar)}>Parcelar pagamento</Label>
            </div>
          )}

          {parcelar && !isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nº de Parcelas</Label>
                  <Input type="number" min={1} max={24} value={numParcelas} onChange={(e) => setNumParcelas(e.target.value)} />
                </div>
                <div>
                  <Label>Data da 1ª Parcela</Label>
                  <Input type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Intervalo</Label>
                  <Select value={intervalo} onValueChange={setIntervalo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Semanal (7d)</SelectItem>
                      <SelectItem value="15">Quinzenal (15d)</SelectItem>
                      <SelectItem value="30">Mensal (30d)</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {intervalo === "custom" && (
                  <div>
                    <Label>Dias</Label>
                    <Input type="number" min={1} value={customDays} onChange={(e) => setCustomDays(e.target.value)} />
                  </div>
                )}
              </div>

              {/* Preview */}
              {installmentPreview.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Preview das parcelas:</p>
                  {installmentPreview.map((p) => (
                    <div key={p.num} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Parcela {p.num}/{installmentPreview.length}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatCurrency(p.value)}</span>
                        <span className="text-muted-foreground text-xs">{format(p.date, "dd/MM/yyyy")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div>
                <Label>Data Pagamento</Label>
                <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <Label>Chave PIX</Label>
            <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Chave PIX do fornecedor" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isEditing ? "Salvar" : parcelar ? `Criar ${numParcelas} parcelas` : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
