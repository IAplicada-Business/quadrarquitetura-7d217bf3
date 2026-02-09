import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Check, ScrollText, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProposals, Proposal } from "@/hooks/useProposals";
import { useLeads, Lead } from "@/hooks/useLeads";

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

const statusColors: Record<string, string> = {
  rascunho: "secondary",
  enviada: "default",
  aprovada: "default",
  rejeitada: "destructive",
};

function formatCurrency(v: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function LeadsProposals() {
  const navigate = useNavigate();
  const { proposals, isLoading, create, update, remove } = useProposals();
  const { leads } = useLeads();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const [formData, setFormData] = useState({
    lead_id: "", project_description: "", value: "", discount_percent: "",
    payment_conditions: "", deadline: "", template_name: "",
  });

  const openNew = () => {
    setEditingProposal(null);
    setFormData({ lead_id: "", project_description: "", value: "", discount_percent: "", payment_conditions: "", deadline: "", template_name: "" });
    setFormOpen(true);
  };

  const openEdit = (p: Proposal) => {
    setEditingProposal(p);
    setFormData({
      lead_id: p.lead_id, project_description: p.project_description || "",
      value: p.value?.toString() || "", discount_percent: p.discount_percent?.toString() || "",
      payment_conditions: p.payment_conditions || "", deadline: p.deadline || "",
      template_name: p.template_name || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.lead_id) return;
    const payload = {
      lead_id: formData.lead_id,
      project_description: formData.project_description || undefined,
      value: formData.value ? Number(formData.value) : undefined,
      discount_percent: formData.discount_percent ? Number(formData.discount_percent) : undefined,
      payment_conditions: formData.payment_conditions || undefined,
      deadline: formData.deadline || undefined,
      template_name: formData.template_name || undefined,
    };
    if (editingProposal) {
      update.mutate({ id: editingProposal.id, ...payload });
    } else {
      create.mutate(payload);
    }
    setFormOpen(false);
  };

  const filtered = statusFilter === "todos" ? proposals : proposals.filter((p) => p.status === statusFilter);

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-display">Propostas</h1>
          <p className="text-sm text-muted-foreground">{proposals.length} proposta(s)</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nova Proposta</Button>
      </div>

      <div className="flex gap-2">
        {["todos", "rascunho", "enviada", "aprovada", "rejeitada"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>
            {s === "todos" ? "Todos" : statusLabels[s]}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">Nenhuma proposta encontrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{(p.leads as any)?.name || "Lead"}</p>
                    <p className="text-xs text-muted-foreground">{(p.leads as any)?.phone}</p>
                  </div>
                  <Badge variant={statusColors[p.status] as any}>{statusLabels[p.status] || p.status}</Badge>
                </div>
                {p.project_description && <p className="text-sm text-muted-foreground line-clamp-2">{p.project_description}</p>}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{formatCurrency(p.value)}</span>
                  {p.discount_percent && <span className="text-muted-foreground">{p.discount_percent}% desc.</span>}
                </div>
                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => remove.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  {p.status === "rascunho" && (
                    <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={() => update.mutate({ id: p.id, status: "enviada" })}>
                      Enviar
                    </Button>
                  )}
                  {p.status === "enviada" && (
                    <Button size="sm" variant="default" className="h-7 text-xs ml-auto" onClick={() => update.mutate({ id: p.id, status: "aprovada" })}>
                      <Check className="h-3 w-3 mr-1" /> Aprovar
                    </Button>
                  )}
                  {p.status === "aprovada" && (
                    <Button size="sm" variant="secondary" className="h-7 text-xs ml-auto" onClick={() => navigate("/leads/contracts")}>
                      <ScrollText className="h-3 w-3 mr-1" /> Gerar Contrato
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingProposal ? "Editar Proposta" : "Nova Proposta"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Lead *</Label>
              <Select value={formData.lead_id} onValueChange={(v) => setFormData({ ...formData, lead_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um lead" /></SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} — {l.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Descrição dos Serviços</Label>
              <Textarea value={formData.project_description} onChange={(e) => setFormData({ ...formData, project_description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Desconto (%)</Label>
              <Input type="number" value={formData.discount_percent} onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Condições de Pagamento</Label>
              <Input value={formData.payment_conditions} onChange={(e) => setFormData({ ...formData, payment_conditions: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Prazo</Label>
              <Input value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!formData.lead_id || create.isPending || update.isPending}>
              {editingProposal ? "Salvar" : "Criar Proposta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
