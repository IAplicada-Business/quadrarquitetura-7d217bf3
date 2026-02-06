import { useState } from "react";
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
    category?: string;
    supplier_name?: string;
    value?: number;
    deadline?: string;
    payment_info?: string;
    product_link?: string;
    specifications?: string;
    status?: "pendente" | "comprado" | "entregue" | "instalado";
  }) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
}

const CATEGORIES = ["Obra Civil", "Elétrica", "Hidráulica", "Tintas", "Marcenaria", "Vidros", "Revestimentos", "Diversos"];

export function PurchaseForm({ open, onOpenChange, onSubmit, initialData, isLoading }: PurchaseFormProps) {
  const [name, setName] = useState(initialData?.name as string || "");
  const [category, setCategory] = useState(initialData?.category as string || "");
  const [supplierName, setSupplierName] = useState(initialData?.supplier_name as string || "");
  const [value, setValue] = useState(initialData?.value ? String(initialData.value) : "");
  const [deadline, setDeadline] = useState(initialData?.deadline as string || "");
  const [paymentInfo, setPaymentInfo] = useState(initialData?.payment_info as string || "");
  const [productLink, setProductLink] = useState(initialData?.product_link as string || "");
  const [specifications, setSpecifications] = useState(initialData?.specifications as string || "");
  const [status, setStatus] = useState(initialData?.status as string || "pendente");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSubmit({
      name,
      category: category || undefined,
      supplier_name: supplierName || undefined,
      value: value ? Number(value) : undefined,
      deadline: deadline || undefined,
      payment_info: paymentInfo || undefined,
      product_link: productLink || undefined,
      specifications: specifications || undefined,
      status: status as "pendente" | "comprado" | "entregue" | "instalado",
    });
    onOpenChange(false);
    setName(""); setCategory(""); setSupplierName(""); setValue("");
    setDeadline(""); setPaymentInfo(""); setProductLink(""); setSpecifications(""); setStatus("pendente");
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
