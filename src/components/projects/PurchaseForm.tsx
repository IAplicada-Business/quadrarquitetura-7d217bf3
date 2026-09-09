import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PurchaseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    category?: string | null;
    supplier_name?: string | null;
    value?: number | null;
    deadline?: string | null;
    payment_info?: string | null;
    product_link?: string | null;
    specifications?: string | null;
    status?: "pendente" | "comprado" | "entregue" | "instalado";
  }) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
}

const CATEGORIES = ["Obra Civil", "Elétrica", "Hidráulica", "Tintas", "Marcenaria", "Vidros", "Revestimentos", "Diversos"];

const str = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

// <input type="date"> só aceita "yyyy-MM-dd"; o banco pode devolver
// timestamp completo ("2026-09-13T00:00:00+00:00"), que o input descarta
// silenciosamente e o campo aparece vazio.
const toDateInput = (v: unknown): string => str(v).slice(0, 10);

export function PurchaseForm({ open, onOpenChange, onSubmit, initialData, isLoading }: PurchaseFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [value, setValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [productLink, setProductLink] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [status, setStatus] = useState("pendente");

  // O diálogo fica montado o tempo todo: o estado era inicializado só no
  // primeiro mount (quando initialData ainda é null), então ao clicar em
  // editar todos os campos apareciam vazios e salvar apagava a compra.
  // Sincroniza sempre que abrir ou trocar o item em edição.
  useEffect(() => {
    if (!open) return;
    setName(str(initialData?.name));
    setCategory(str(initialData?.category));
    setSupplierName(str(initialData?.supplier_name));
    setValue(initialData?.value === null || initialData?.value === undefined ? "" : String(initialData.value));
    setDeadline(toDateInput(initialData?.deadline));
    setPaymentInfo(str(initialData?.payment_info));
    setProductLink(str(initialData?.product_link));
    setSpecifications(str(initialData?.specifications));
    setStatus(str(initialData?.status) || "pendente");
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSubmit({
      name,
      // Campos limpos pela arquiteta precisam ir como null, não como
      // undefined — undefined some do payload e o valor antigo persiste.
      category: category || null,
      supplier_name: supplierName || null,
      value: value ? Number(value) : null,
      deadline: deadline || null,
      payment_info: paymentInfo || null,
      product_link: productLink || null,
      specifications: specifications || null,
      status: status as "pendente" | "comprado" | "entregue" | "instalado",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-display">
            {initialData ? "Editar Compra" : "Nova Compra"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Material/Serviço</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do material ou serviço..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Local/Fornecedor</Label>
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Onde comprar" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div>
              <Label>Data Limite</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Dados para Pagamento</Label>
            <Input value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} placeholder="PIX, transferência..." />
          </div>
          <div>
            <Label>Link do Produto</Label>
            <Input value={productLink} onChange={(e) => setProductLink(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Especificações</Label>
            <Textarea value={specifications} onChange={(e) => setSpecifications(e.target.value)} rows={2} placeholder="Detalhes técnicos..." />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">A Comprar</SelectItem>
                <SelectItem value="comprado">Comprado</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
                <SelectItem value="instalado">Instalado</SelectItem>
              </SelectContent>
            </Select>
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
