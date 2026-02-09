import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MaterialTrackingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    material_name: string;
    quantity_needed?: number;
    quantity_purchased?: number;
    quantity_delivered?: number;
    quantity_used?: number;
    purchase_date?: string;
    delivery_date?: string;
    notes?: string;
    discipline?: string;
    unit?: string;
    supplier_name?: string;
    product_link?: string;
  }) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
  disciplines?: string[];
}

export function MaterialTrackingForm({ open, onOpenChange, onSubmit, initialData, isLoading, disciplines = [] }: MaterialTrackingFormProps) {
  const [name, setName] = useState(initialData?.material_name as string || "");
  const [needed, setNeeded] = useState(initialData?.quantity_needed ? String(initialData.quantity_needed) : "");
  const [purchased, setPurchased] = useState(initialData?.quantity_purchased ? String(initialData.quantity_purchased) : "");
  const [delivered, setDelivered] = useState(initialData?.quantity_delivered ? String(initialData.quantity_delivered) : "");
  const [used, setUsed] = useState(initialData?.quantity_used ? String(initialData.quantity_used) : "");
  const [purchaseDate, setPurchaseDate] = useState(initialData?.purchase_date as string || "");
  const [deliveryDate, setDeliveryDate] = useState(initialData?.delivery_date as string || "");
  const [notes, setNotes] = useState(initialData?.notes as string || "");
  const [discipline, setDiscipline] = useState(initialData?.discipline as string || "");
  const [unit, setUnit] = useState(initialData?.unit as string || "");
  const [supplierName, setSupplierName] = useState(initialData?.supplier_name as string || "");
  const [productLink, setProductLink] = useState(initialData?.product_link as string || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSubmit({
      material_name: name,
      quantity_needed: needed ? Number(needed) : undefined,
      quantity_purchased: purchased ? Number(purchased) : undefined,
      quantity_delivered: delivered ? Number(delivered) : undefined,
      quantity_used: used ? Number(used) : undefined,
      purchase_date: purchaseDate || undefined,
      delivery_date: deliveryDate || undefined,
      notes: notes || undefined,
      discipline: discipline || undefined,
      unit: unit || undefined,
      supplier_name: supplierName || undefined,
      product_link: productLink || undefined,
    });
    onOpenChange(false);
    setName(""); setNeeded(""); setPurchased(""); setDelivered("");
    setUsed(""); setPurchaseDate(""); setDeliveryDate(""); setNotes("");
    setDiscipline(""); setUnit(""); setSupplierName(""); setProductLink("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-display">
            {initialData ? "Editar Material" : "Novo Material"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do Material</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cimento CP II, Areia média..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Disciplina</Label>
              <Select value={discipline} onValueChange={setDiscipline}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {disciplines.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {["un", "m²", "m³", "m", "kg", "L", "sc", "pç", "cx", "rolo"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Qtd Necessária</Label>
              <Input type="number" step="0.01" value={needed} onChange={(e) => setNeeded(e.target.value)} />
            </div>
            <div>
              <Label>Qtd Comprada</Label>
              <Input type="number" step="0.01" value={purchased} onChange={(e) => setPurchased(e.target.value)} />
            </div>
            <div>
              <Label>Qtd Entregue</Label>
              <Input type="number" step="0.01" value={delivered} onChange={(e) => setDelivered(e.target.value)} />
            </div>
            <div>
              <Label>Qtd Usada</Label>
              <Input type="number" step="0.01" value={used} onChange={(e) => setUsed(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fornecedor</Label>
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nome do fornecedor" />
            </div>
            <div>
              <Label>Link de Compra</Label>
              <Input value={productLink} onChange={(e) => setProductLink(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data da Compra</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div>
              <Label>Data da Entrega</Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Compras avulsas, serviços adicionais..." />
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
