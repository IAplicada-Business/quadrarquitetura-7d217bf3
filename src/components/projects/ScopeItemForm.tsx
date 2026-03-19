import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_HIERARCHY = ["rascunho", "planejado", "em_cotacao", "contratado", "em_execucao", "executado"];
const LOCK_THRESHOLD = 3;

const scopeStatusOptions = [
  { value: "rascunho", label: "Rascunho" },
  { value: "planejado", label: "Planejado" },
  { value: "em_cotacao", label: "Em Cotação" },
  { value: "contratado", label: "Contratado" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "executado", label: "Executado" },
];

interface ScopeItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  parentOptions?: { id: string; discipline: string }[];
  isLoading?: boolean;
}

export function ScopeItemForm({ open, onOpenChange, onSubmit, initialData, parentOptions, isLoading }: ScopeItemFormProps) {
  const [discipline, setDiscipline] = useState("");
  const [description, setDescription] = useState("");
  const [activities, setActivities] = useState("");
  const [suppliersToQuote, setSuppliersToQuote] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [entryOrder, setEntryOrder] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState("planejado");

  useEffect(() => {
    if (initialData) {
      setDiscipline((initialData.discipline as string) || "");
      setDescription((initialData.description as string) || "");
      setActivities((initialData.activities as string) || "");
      setSuppliersToQuote((initialData.suppliers_to_quote as string) || "");
      setPaymentTerms((initialData.payment_terms as string) || "");
      setEntryOrder(initialData.entry_order ? String(initialData.entry_order) : "");
      setServiceDuration((initialData.service_duration as string) || "");
      setParentId((initialData.parent_id as string) || "");
      setStatus((initialData.status as string) || "planejado");
    } else {
      setDiscipline(""); setDescription(""); setActivities(""); setSuppliersToQuote(""); setPaymentTerms("");
      setEntryOrder(""); setServiceDuration(""); setParentId(""); setStatus("planejado");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      discipline,
      description: description || null,
      activities: activities || null,
      suppliers_to_quote: suppliersToQuote || null,
      payment_terms: paymentTerms || null,
      entry_order: entryOrder ? Number(entryOrder) : null,
      service_duration: serviceDuration || null,
      parent_id: parentId || null,
      status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-display">{initialData ? "Editar Disciplina" : "Nova Disciplina"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Disciplina *</Label>
            <Input value={discipline} onChange={(e) => setDiscipline(e.target.value)} required placeholder="Ex: Alvenaria, Gesso, Elétrica..." />
          </div>
          <div>
            <Label>Descrição dos Serviços</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva os serviços que serão executados..." rows={2} />
          </div>
          <div>
            <Label>Atividades Detalhadas</Label>
            <Textarea value={activities} onChange={(e) => setActivities(e.target.value)} placeholder="Liste as atividades (uma por linha)..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ordem de Entrada</Label>
              <Input type="number" value={entryOrder} onChange={(e) => setEntryOrder(e.target.value)} placeholder="1, 2, 3..." />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {scopeStatusOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tempo de Serviço</Label>
              <Input value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)} placeholder="Ex: 5 dias" />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Ex: 50%/50%" />
            </div>
          </div>
          <div>
            <Label>Fornecedores a Orçar</Label>
            <Input value={suppliersToQuote} onChange={(e) => setSuppliersToQuote(e.target.value)} placeholder="Nomes dos fornecedores..." />
          </div>
          {parentOptions && parentOptions.length > 0 && (
            <div>
              <Label>Disciplina Pai (subdivisão)</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">Nenhuma (disciplina principal)</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.discipline}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !discipline}>{initialData ? "Salvar" : "Adicionar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
