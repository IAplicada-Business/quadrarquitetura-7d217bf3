import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Opção de disciplina pra vincular a cotação. `scopeItemId` é null quando a
 *  disciplina só existe nas atividades do Escopo (sem item de escopo ainda) —
 *  nesse caso quem recebe o submit cria o item na hora. */
export interface DisciplineOption {
  discipline: string;
  scopeItemId: string | null;
}

/* Radix <Select.Item> lança erro se value="" (ele reserva a string vazia pro
   placeholder). Era exatamente isso que quebrava o "Editar para vincular":
   a opção "Sem disciplina" derrubava o formulário inteiro ao abrir. */
const NO_DISCIPLINE = "__sem_disciplina__";

interface BudgetQuoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  scopeItemId?: string;
  scopeItemName?: string;
  revisionNumber?: number;
  isLoading?: boolean;
  disciplineOptions?: DisciplineOption[];
}

export function BudgetQuoteForm({ open, onOpenChange, onSubmit, initialData, scopeItemId, scopeItemName, revisionNumber = 1, isLoading, disciplineOptions = [] }: BudgetQuoteFormProps) {
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [servicesDescription, setServicesDescription] = useState("");
  const [value, setValue] = useState("");
  const [materialEstimate, setMaterialEstimate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [status, setStatus] = useState("pendente");
  const [selectedDiscipline, setSelectedDiscipline] = useState("");

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
      // A disciplina atual vem do item de escopo vinculado ou, na falta dele,
      // da disciplina que a aba já derivou pela atividade (_discipline).
      const fromScopeItem = initialData.scope_item_id
        ? disciplineOptions.find(o => o.scopeItemId === initialData.scope_item_id)?.discipline
        : undefined;
      setSelectedDiscipline(fromScopeItem || (initialData._discipline as string) || "");
    } else {
      setSupplierId(""); setSupplierName(""); setServicesDescription("");
      setValue(""); setMaterialEstimate(""); setDeliveryTime(""); setPaymentTerms(""); setStatus("pendente");
      setSelectedDiscipline(
        (scopeItemId && disciplineOptions.find(o => o.scopeItemId === scopeItemId)?.discipline) || ""
      );
    }
    // disciplineOptions é derivado por useMemo na aba; não entra nas deps pra
    // não resetar o formulário a cada render do pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, open, scopeItemId]);

  const selectedOption = disciplineOptions.find(o => o.discipline === selectedDiscipline);
  const selectedScopeName = selectedOption?.discipline;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      scope_item_id: selectedOption?.scopeItemId ?? null,
      // Disciplina escolhida que ainda não tem item de escopo: a aba cria o
      // item e usa o id dele, senão o vínculo se perderia no banco (não há
      // coluna de disciplina em budget_quotes).
      _link_discipline: selectedOption && !selectedOption.scopeItemId ? selectedDiscipline : null,
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
          <div>
            <Label>Disciplina</Label>
            {disciplineOptions.length > 0 ? (
              <Select
                value={selectedDiscipline || NO_DISCIPLINE}
                onValueChange={(v) => setSelectedDiscipline(v === NO_DISCIPLINE ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem disciplina vinculada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DISCIPLINE}>Sem disciplina</SelectItem>
                  {disciplineOptions.map(o => (
                    <SelectItem key={o.discipline} value={o.discipline}>{o.discipline}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Nenhuma disciplina cadastrada ainda. Cadastre atividades com disciplina na aba
                “Escopo” para poder vincular esta cotação.
              </p>
            )}
          </div>
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
