import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Phone, Mail, ArrowRight, Trash2, Pencil, UserCheck,
  LayoutGrid, List, Search, Filter, Users, CalendarCheck, TrendingUp, XCircle,
} from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeads, LEAD_STATUSES, leadStatusLabels, Lead } from "@/hooks/useLeads";

const originLabels: Record<string, string> = {
  indicacao: "Indicação", instagram: "Instagram", google: "Google", site: "Site", outro: "Outro",
};
const typeLabels: Record<string, string> = {
  residencial: "Residencial", comercial: "Comercial", saude: "Saúde", outro: "Outro",
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

  const [view, setView] = useState<"kanban" | "tabela">("kanban");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterOrigin, setFilterOrigin] = useState("todos");

  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: "", phone: "", email: "", phone_secondary: "",
    project_type: "residencial", origin: "outro", responsible: "", notes: "", meeting_date: "",
  });

  const filtered = useMemo(() => {
    let result = leads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.email && l.email.toLowerCase().includes(q)));
    }
    if (filterStatus !== "todos") result = result.filter((l) => l.status === filterStatus);
    if (filterOrigin !== "todos") result = result.filter((l) => l.origin === filterOrigin);
    return result;
  }, [leads, search, filterStatus, filterOrigin]);

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
    if (idx < 0 || idx >= LEAD_STATUSES.length - 2) return null;
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
    <div className="space-y-4 animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Pipeline de Leads</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} de {leads.length} lead(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="px-3"><LayoutGrid className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="tabela" className="px-3"><List className="h-4 w-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone ou email…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{leadStatusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Origens</SelectItem>
            {Object.entries(originLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      {(() => {
        const total = leads.length;
        const novos = leads.filter((l) => l.status === "novo").length;
        const reunioes = leads.filter((l) => l.status === "reuniao_agendada").length;
        const fechados = leads.filter((l) => l.status === "fechado").length;
        const perdidos = leads.filter((l) => l.status === "perdido").length;
        const conversionRate = total > 0 ? Math.round((fechados / total) * 100) : 0;
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Card className="bg-blue-50/50 border-blue-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-full text-blue-600"><Users className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Leads</p>
                  <p className="text-xl font-bold text-blue-700">{total}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-50/50 border-amber-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-full text-amber-600"><Plus className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Novos</p>
                  <p className="text-xl font-bold text-amber-700">{novos}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50/50 border-purple-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-full text-purple-600"><CalendarCheck className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Reuniões</p>
                  <p className="text-xl font-bold text-purple-700">{reunioes}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50/50 border-green-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-full text-green-600"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Conversão</p>
                  <p className="text-xl font-bold text-green-700">{conversionRate}%</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 border-red-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-red-100 rounded-full text-red-600"><XCircle className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Perdidos</p>
                  <p className="text-xl font-bold text-red-700">{perdidos}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {LEAD_STATUSES.map((status) => {
            const columnLeads = filtered.filter((l) => l.status === status);
            return (
              <div key={status} className="min-w-[250px] flex-1 flex-shrink-0 flex flex-col">
                <div className={`rounded-t-lg px-3 py-2 border ${statusColors[status]} font-medium text-sm flex items-center justify-between`}>
                  <span>{leadStatusLabels[status]}</span>
                  <Badge variant="outline" className="text-xs">{columnLeads.length}</Badge>
                </div>
                <div className="border border-t-0 rounded-b-lg bg-muted/30 flex-1 min-h-[400px] p-2 space-y-2 overflow-y-auto">
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
      )}

      {/* Table View */}
      {view === "tabela" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Origem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</TableCell>
                  </TableRow>
                )}
                {filtered.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-sm">{lead.phone}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{lead.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${statusColors[lead.status]}`}>
                        {leadStatusLabels[lead.status] || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="outline" className="text-xs">{typeLabels[lead.project_type] || lead.project_type}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {originLabels[lead.origin] || lead.origin}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getNextStatus(lead.status) && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Avançar" onClick={() => moveStatus(lead, getNextStatus(lead.status)!)}>
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(lead)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
