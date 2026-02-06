import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CATEGORIES = ["Obra Civil", "Elétrica", "Hidráulica", "Tintas", "Marcenaria", "Diversos"];

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    invoice_number?: string;
    store_name?: string;
    category?: string;
    description?: string;
    value?: number;
  }) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
}

export function InvoiceForm({ open, onOpenChange, onSubmit, initialData, isLoading }: InvoiceFormProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoice_number as string || "");
  const [storeName, setStoreName] = useState(initialData?.store_name as string || "");
  const [category, setCategory] = useState(initialData?.category as string || "");
  const [description, setDescription] = useState(initialData?.description as string || "");
  const [value, setValue] = useState(initialData?.value ? String(initialData.value) : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      invoice_number: invoiceNumber || undefined,
      store_name: storeName || undefined,
      category: category || undefined,
      description: description || undefined,
      value: value ? Number(value) : undefined,
    });
    onOpenChange(false);
    setInvoiceNumber(""); setStoreName(""); setCategory(""); setDescription(""); setValue("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-display">
            {initialData ? "Editar Nota Fiscal" : "Nova Nota Fiscal"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nº da NF</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="001" />
            </div>
            <div>
              <Label>Lugar/Loja</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Nome da loja" />
            </div>
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
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descrição da NF..." />
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
