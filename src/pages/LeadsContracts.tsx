import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContracts, Contract } from "@/hooks/useContracts";
import { useProposals } from "@/hooks/useProposals";

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  assinado: "Assinado",
  cancelado: "Cancelado",
};

function formatCurrency(v: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function LeadsContracts() {
  const navigate = useNavigate();
  const { contracts, isLoading, create, update, remove, signAndCreateProject } = useContracts();
  const { proposals } = useProposals();
  const approvedProposals = proposals.filter((p) => p.status === "aprovada");

  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const [formData, setFormData] = useState({
    proposal_id: "", template_name: "", clauses: "", address: "", city: "",
    value: "", payment_conditions: "", start_date: "",
  });

  const openNew = () => {
    setEditingContract(null);
    setFormData({ proposal_id: "", template_name: "", clauses: "", address: "", city: "", value: "", payment_conditions: "", start_date: "" });
    setFormOpen(true);
  };

  const openEdit = (c: Contract) => {
    setEditingContract(c);
    setFormData({
      proposal_id: c.proposal_id, template_name: c.template_name || "",
      clauses: c.clauses || "", address: c.address || "", city: c.city || "",
      value: c.value?.toString() || "", payment_conditions: c.payment_conditions || "",
      start_date: c.start_date || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.proposal_id) return;
    const payload = {
      proposal_id: formData.proposal_id,
      template_name: formData.template_name || undefined,
      clauses: formData.clauses || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      value: formData.value ? Number(formData.value) : undefined,
      payment_conditions: formData.payment_conditions || undefined,
      start_date: formData.start_date || undefined,
    };
    if (editingContract) {
      update.mutate({ id: editingContract.id, ...payload });
    } else {
      create.mutate(payload);
    }
    setFormOpen(false);
  };

  const filtered = statusFilter === "todos" ? contracts : contracts.filter((c) => c.status === statusFilter);

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-display">Contratos</h1>
          <p className="text-sm text-muted-foreground">{contracts.length} contrato(s)</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Contrato</Button>
      </div>

      <div className="flex gap-2">
        {["todos", "rascunho", "enviado", "assinado", "cancelado"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
            {s === "todos" ? "Todos" : statusLabels[s]}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">Nenhum contrato encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const leadName = (c.proposals as any)?.leads?.name || "—";
            return (
              <Card key={c.id} className="shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{leadName}</p>
                      <p className="text-xs text-muted-foreground">{c.address ? `${c.address}${c.city ? `, ${c.city}` : ""}` : "Sem endereço"}</p>
                    </div>
                    <Badge variant={c.status === "assinado" ? "default" : "secondary"}>{statusLabels[c.status] || c.status}</Badge>
                  </div>
                  <div className="text-sm font-bold">{formatCurrency(c.value)}</div>
                  {c.start_date && <p className="text-xs text-muted-foreground">Início: {c.start_date}</p>}
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => remove.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                    {(c.status === "rascunho" || c.status === "enviado") && (
                      <Button size="sm" variant="default" className="h-7 text-xs ml-auto" onClick={() => signAndCreateProject.mutate(c)} disabled={signAndCreateProject.isPending}>
                        <FileSignature className="h-3 w-3 mr-1" /> Assinar e Criar Projeto
                      </Button>
                    )}
                    {c.status === "assinado" && c.project_id && (
                      <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={() => navigate(`/projects/${c.project_id}`)}>
                        Ver Projeto
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingContract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Proposta Aprovada *</Label>
              <Select value={formData.proposal_id} onValueChange={(v) => setFormData({ ...formData, proposal_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma proposta" /></SelectTrigger>
                <SelectContent>
                  {approvedProposals.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{(p.leads as any)?.name || "Lead"} — {formatCurrency(p.value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Início</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Condições de Pagamento</Label>
              <Input value={formData.payment_conditions} onChange={(e) => setFormData({ ...formData, payment_conditions: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Cláusulas</Label>
              <Textarea value={formData.clauses} onChange={(e) => setFormData({ ...formData, clauses: e.target.value })} rows={4} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!formData.proposal_id || create.isPending || update.isPending}>
              {editingContract ? "Salvar" : "Criar Contrato"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
