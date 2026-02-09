import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Phone, Mail, ArrowRight, Trash2, Pencil, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads, LEAD_STATUSES, leadStatusLabels, Lead } from "@/hooks/useLeads";

const originLabels: Record<string, string> = {
  indicacao: "Indicação",
  instagram: "Instagram",
  google: "Google",
  site: "Site",
  outro: "Outro",
};

const typeLabels: Record<string, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  saude: "Saúde",
  outro: "Outro",
};

const statusColors: Record<string, string> = {
  novo: "bg-blue-500/10 text-blue-700 border-blue-200",
  contato_feito: "bg-amber-500/10 text-amber-700 border-amber-200",
  reuniao_agendada: "bg-purple-500/10 text-purple-700 border-purple-200",
  proposta_enviada: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  fechado: "bg-green-500/10 text-green-700 border-green-200",
  perdido: "bg-red-500/10 text-red-700 border-red-200",
};

export default function LeadsPipeline() {
  const navigate = useNavigate();
  const { leads, isLoading, create, update, remove, convertToClient } = useLeads();
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", phone_secondary: "",
    project_type: "residencial", origin: "outro", responsible: "", notes: "", meeting_date: "",
  });

  const openNew = () => {
    setEditingLead(null);
    setFormData({ name: "", phone: "", email: "", phone_secondary: "", project_type: "residencial", origin: "outro", responsible: "", notes: "", meeting_date: "" });
    setFormOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name, phone: lead.phone, email: lead.email || "",
      phone_secondary: lead.phone_secondary || "", project_type: lead.project_type,
      origin: lead.origin, responsible: lead.responsible || "",
      notes: lead.notes || "", meeting_date: lead.meeting_date || "",
    });
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone) return;
    if (editingLead) {
      update.mutate({ id: editingLead.id, ...formData });
    } else {
      create.mutate(formData);
    }
    setFormOpen(false);
  };

  const moveStatus = (lead: Lead, newStatus: string) => {
    if (newStatus === "fechado" && !lead.converted_client_id) {
      convertToClient.mutate(lead);
    } else {
      update.mutate({ id: lead.id, status: newStatus });
    }
  };

  const getNextStatus = (status: string): string | null => {
    const idx = LEAD_STATUSES.indexOf(status as any);
    if (idx < 0 || idx >= LEAD_STATUSES.length - 2) return null; // skip "perdido"
    return LEAD_STATUSES[idx + 1];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-display">Pipeline de Leads</h1>
          <p className="text-sm text-muted-foreground">{leads.length} lead(s) no total</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Lead
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
        {LEAD_STATUSES.map((status) => {
          const columnLeads = leads.filter((l) => l.status === status);
          return (
            <div key={status} className="min-w-[220px]">
              <div className={`rounded-t-lg px-3 py-2 border ${statusColors[status]} font-medium text-sm flex items-center justify-between`}>
                <span>{leadStatusLabels[status]}</span>
                <Badge variant="outline" className="text-xs">{columnLeads.length}</Badge>
              </div>
              <div className="border border-t-0 rounded-b-lg bg-muted/30 min-h-[200px] p-2 space-y-2">
                {columnLeads.map((lead) => (
                  <Card key={lead.id} className="shadow-sm">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-sm leading-tight">{lead.name}</p>
                        <div className="flex gap-0.5">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(lead)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove.mutate(lead.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">{typeLabels[lead.project_type] || lead.project_type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{originLabels[lead.origin] || lead.origin}</Badge>
                      </div>
                      <div className="flex gap-1 pt-1">
                        {getNextStatus(lead.status) && (
                          <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveStatus(lead, getNextStatus(lead.status)!)}>
                            <ArrowRight className="h-3 w-3 mr-1" /> Avançar
                          </Button>
                        )}
                        {lead.status === "proposta_enviada" && (
                          <Button size="sm" variant="secondary" className="text-xs h-7" onClick={() => navigate("/leads/proposals")}>
                            Proposta
                          </Button>
                        )}
                        {lead.status !== "fechado" && lead.status !== "perdido" && (
                          <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={() => moveStatus(lead, "perdido")}>
                            Perdido
                          </Button>
                        )}
                        {lead.status === "fechado" && lead.converted_client_id && (
                          <Badge variant="secondary" className="text-[10px]">
                            <UserCheck className="h-3 w-3 mr-1" /> Cliente criado
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone *</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone Secundário</Label>
              <Input value={formData.phone_secondary} onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Projeto</Label>
              <Select value={formData.project_type} onValueChange={(v) => setFormData({ ...formData, project_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residencial">Residencial</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={formData.origin} onValueChange={(v) => setFormData({ ...formData, origin: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <Input value={formData.responsible} onChange={(e) => setFormData({ ...formData, responsible: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Data da Reunião</Label>
              <Input type="date" value={formData.meeting_date} onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.phone || create.isPending || update.isPending}>
              {editingLead ? "Salvar" : "Criar Lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
