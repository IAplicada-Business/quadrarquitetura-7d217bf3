import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BudgetQuoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  scopeItemId?: string;
  scopeItemName?: string;
  revisionNumber?: number;
  isLoading?: boolean;
  allScopeItems?: { id: string; discipline: string | null }[];
}

export function BudgetQuoteForm({ open, onOpenChange, onSubmit, initialData, scopeItemId, scopeItemName, revisionNumber = 1, isLoading, allScopeItems }: BudgetQuoteFormProps) {
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [servicesDescription, setServicesDescription] = useState("");
  const [value, setValue] = useState("");
  const [materialEstimate, setMaterialEstimate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [status, setStatus] = useState("pendente");
  const [selectedScopeItemId, setSelectedScopeItemId] = useState("");

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (initialData) {
      setSupplierId((initialData.supplier_id as string) || "");
      setSupplierName((initialData.supplier_name as string) || "");
      setServicesDescription((initialData.services_description as string) || "");
      setValue(initialData.value ? String(initialData.value) : "");
      setMaterialEstimate(initialData.material_estimate ? String(initialData.material_estimate) : "");
      setDeliveryTime((initialData.delivery_time as string) || "");
      setPaymentTerms((initialData.payment_terms as string) || "");
      setStatus((initialData.status as string) || "pendente");
      setSelectedScopeItemId((initialData.scope_item_id as string) || "");
    } else {
      setSupplierId(""); setSupplierName(""); setServicesDescription("");
      setValue(""); setMaterialEstimate(""); setDeliveryTime(""); setPaymentTerms(""); setStatus("pendente");
      setSelectedScopeItemId(scopeItemId || "");
    }
  }, [initialData, open, scopeItemId]);

  const selectedScopeName = allScopeItems?.find(s => s.id === selectedScopeItemId)?.discipline;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      scope_item_id: selectedScopeItemId || null,
      supplier_id: supplierId || null,
      supplier_name: supplierName || null,
      services_description: servicesDescription || null,
      value: value ? Number(value) : null,
      material_estimate: materialEstimate ? Number(materialEstimate) : null,
      delivery_time: deliveryTime || null,
      payment_terms: paymentTerms || null,
      status,
      revision: `Rev ${revisionNumber}`,
      revision_number: revisionNumber,
      is_current_revision: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-display">
            {initialData ? "Editar Cotação" : "Nova Cotação"}
            {(selectedScopeName || scopeItemName) && (
              <span className="text-sm font-normal text-muted-foreground ml-2">— {selectedScopeName || scopeItemName}</span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {allScopeItems && allScopeItems.length > 0 && (
            <div>
              <Label>Disciplina</Label>
              <Select value={selectedScopeItemId} onValueChange={setSelectedScopeItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem disciplina vinculada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem disciplina</SelectItem>
                  {allScopeItems.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.discipline}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Fornecedor (cadastrado)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Selecione ou preencha abaixo..." /></SelectTrigger>
              <SelectContent>
                {suppliers?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ou nome livre do fornecedor</Label>
            <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Nome do fornecedor..." />
          </div>
          <div>
            <Label>Serviços Orçados</Label>
            <Textarea value={servicesDescription} onChange={(e) => setServicesDescription(e.target.value)} placeholder="Descreva os serviços cotados..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor do Serviço (R$)</Label>
              <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div>
              <Label>Estimativa Material (R$)</Label>
              <Input type="number" step="0.01" value={materialEstimate} onChange={(e) => setMaterialEstimate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prazo de Entrega</Label>
              <Input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="Ex: 10 dias úteis" />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Ex: 50%/50%" />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="cotado">Cotado</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{initialData ? "Salvar" : "Adicionar Cotação"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
