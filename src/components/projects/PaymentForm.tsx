import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
}

export function PaymentForm({ open, onOpenChange, onSubmit, initialData, isLoading }: PaymentFormProps) {
  const [value, setValue] = useState(initialData?.value ? String(initialData.value) : "");
  const [description, setDescription] = useState(initialData?.description as string || "");
  const [dueDate, setDueDate] = useState(initialData?.due_date as string || "");
  const [paidDate, setPaidDate] = useState(initialData?.paid_date as string || "");
  const [status, setStatus] = useState(initialData?.status as string || "pendente");
  const [installment, setInstallment] = useState(initialData?.installment_number ? String(initialData.installment_number) : "");
  const [totalInstallments, setTotalInstallments] = useState(initialData?.total_installments ? String(initialData.total_installments) : "");
  const [pixKey, setPixKey] = useState(initialData?.pix_key as string || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    onSubmit({
      value: Number(value),
      description: description || undefined,
      due_date: dueDate || undefined,
      paid_date: paidDate || undefined,
      status: status as "pendente" | "notificado" | "pago" | "atrasado",
      installment_number: installment ? Number(installment) : undefined,
      total_installments: totalInstallments ? Number(totalInstallments) : undefined,
      pix_key: pixKey || undefined,
    });
    onOpenChange(false);
    setValue(""); setDescription(""); setDueDate(""); setPaidDate("");
    setStatus("pendente"); setInstallment(""); setTotalInstallments(""); setPixKey("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-display">
            {initialData ? "Editar Pagamento" : "Novo Pagamento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Marcenaria - Parcela 1/3" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$)</Label>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Parcela Nº</Label>
              <Input type="number" value={installment} onChange={(e) => setInstallment(e.target.value)} placeholder="1" />
            </div>
            <div>
              <Label>Total Parcelas</Label>
              <Input type="number" value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} placeholder="3" />
            </div>
          </div>
          <div>
            <Label>Chave PIX</Label>
            <Input value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Chave PIX do fornecedor" />
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
