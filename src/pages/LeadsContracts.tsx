import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash2, Pencil, FileSignature, Send, X, Settings2 } from "lucide-react";
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
import { useContractTemplates } from "@/hooks/useContractTemplates";
import { ContractPreview } from "@/components/leads/ContractPreview";
import { TemplateManager } from "@/components/leads/TemplateManager";

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho", enviado: "Enviado", assinado: "Assinado", cancelado: "Cancelado",
};

function formatCurrency(v: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function generateContractNumber(contracts: Contract[]): string {
  const year = new Date().getFullYear();
  const thisYear = contracts.filter(c => (c as any).contract_number?.startsWith(`CONTR-${year}`));
  const seq = thisYear.length + 1;
  return `CONTR-${year}-${String(seq).padStart(3, "0")}`;
}

export default function LeadsContracts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { contracts, isLoading, create, update, remove, signAndCreateProject } = useContracts();
  const { proposals } = useProposals();
  const { templates, create: createTemplate, update: updateTemplate, remove: removeTemplate } = useContractTemplates();
  const approvedProposals = proposals.filter((p) => p.status === "aprovada");

  const [formOpen, setFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [cancelOpen, setCancelOpen] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [activeTab, setActiveTab] = useState("lista");

  const [formData, setFormData] = useState({
    proposal_id: "", template_id: "", title: "", clauses: "", custom_clauses: "",
    address: "", city: "", construction_neighborhood: "",
    value: "", payment_conditions: "", payment_method: "", start_date: "", estimated_duration: "",
    client_name: "", client_cpf_cnpj: "", client_email: "", client_phone: "", client_address: "",
    service_description: "", notes: "", environments: "", total_area: "",
  });

  const selectedTemplate = templates.find(t => t.id === formData.template_id) || null;

  const openNew = () => {
    setEditingContract(null);
    setFormData({
      proposal_id: "", template_id: "", title: "", clauses: "", custom_clauses: "",
      address: "", city: "", construction_neighborhood: "",
      value: "", payment_conditions: "", payment_method: "", start_date: "", estimated_duration: "",
      client_name: "", client_cpf_cnpj: "", client_email: "", client_phone: "", client_address: "",
      service_description: "", notes: "", environments: "", total_area: "",
    });
    setFormOpen(true);
  };

  const openEdit = (c: Contract) => {
    setEditingContract(c);
    setFormData({
      proposal_id: c.proposal_id, template_id: (c as any).template_id || "",
      title: (c as any).title || "", clauses: c.clauses || "", custom_clauses: (c as any).custom_clauses || "",
      address: c.address || "", city: c.city || "", construction_neighborhood: (c as any).construction_neighborhood || "",
      value: c.value?.toString() || "", payment_conditions: c.payment_conditions || "",
      payment_method: (c as any).payment_method || "", start_date: c.start_date || "",
      estimated_duration: (c as any).estimated_duration || "",
      client_name: (c as any).client_name || "", client_cpf_cnpj: (c as any).client_cpf_cnpj || "",
      client_email: (c as any).client_email || "", client_phone: (c as any).client_phone || "",
      client_address: (c as any).client_address || "",
      service_description: (c as any).service_description || "", notes: (c as any).notes || "",
    });
    setFormOpen(true);
  };

  const handleSelectProposal = (proposalId: string) => {
    const p = proposals.find(pr => pr.id === proposalId);
    if (p) {
      const lead = p.leads as any;
      setFormData(prev => ({
        ...prev,
        proposal_id: proposalId,
        value: (p as any).final_value?.toString() || p.value?.toString() || "",
        payment_conditions: p.payment_conditions || "",
        payment_method: (p as any).payment_method || "",
        client_name: lead?.name || "",
        client_email: lead?.email || "",
        client_phone: lead?.phone || "",
        service_description: p.project_description || "",
        estimated_duration: (p as any).estimated_duration || p.deadline || "",
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.proposal_id) return;
    const payload: Record<string, unknown> = {
      proposal_id: formData.proposal_id,
      template_id: formData.template_id || null,
      title: formData.title || null,
      clauses: formData.clauses || null,
      custom_clauses: formData.custom_clauses || null,
      address: formData.address || null,
      city: formData.city || null,
      construction_neighborhood: formData.construction_neighborhood || null,
      value: formData.value ? Number(formData.value) : null,
      payment_conditions: formData.payment_conditions || null,
      payment_method: formData.payment_method || null,
      start_date: formData.start_date || null,
      estimated_duration: formData.estimated_duration || null,
      client_name: formData.client_name || null,
      client_cpf_cnpj: formData.client_cpf_cnpj || null,
      client_email: formData.client_email || null,
      client_phone: formData.client_phone || null,
      client_address: formData.client_address || null,
      service_description: formData.service_description || null,
      notes: formData.notes || null,
    };
    if (editingContract) {
      update.mutate({ id: editingContract.id, ...payload });
    } else {
      const num = generateContractNumber(contracts);
      create.mutate({ ...payload, contract_number: num } as any);
    }
    setFormOpen(false);
  };

  const handleCancel = (id: string) => {
    update.mutate({ id, status: "cancelado", cancelled_at: new Date().toISOString(), cancellation_reason: cancelReason });
    setCancelOpen(null);
    setCancelReason("");
  };

  const filtered = statusFilter === "todos" ? contracts : contracts.filter((c) => c.status === statusFilter);

  // Auto-open contract from conversion flow
  useEffect(() => {
    const editId = (location.state as any)?.editContractId;
    if (editId && contracts.length > 0) {
      const contract = contracts.find((c) => c.id === editId);
      if (contract) {
        openEdit(contract);
        // Clear state to prevent re-opening on navigation
        window.history.replaceState({}, document.title);
      }
    }
  }, [contracts, location.state]);

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab(activeTab === "templates" ? "lista" : "templates")}>
            <Settings2 className="h-4 w-4 mr-1" /> Templates
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Contrato</Button>
        </div>
      </div>

      {activeTab === "templates" ? (
        <TemplateManager
          title="Templates de Contrato"
          templates={templates}
          fields={[
            { key: "clause_object", label: "Cláusula — Objeto", multiline: true },
            { key: "clause_scope", label: "Cláusula — Escopo", multiline: true },
            { key: "clause_value", label: "Cláusula — Valor e Pagamento", multiline: true },
            { key: "clause_duration", label: "Cláusula — Prazo", multiline: true },
            { key: "clause_obligations_contractor", label: "Obrigações da Contratada", multiline: true },
            { key: "clause_obligations_client", label: "Obrigações do Contratante", multiline: true },
            { key: "clause_termination", label: "Cláusula — Rescisão", multiline: true },
            { key: "clause_confidentiality", label: "Cláusula — Confidencialidade", multiline: true },
            { key: "clause_general", label: "Disposições Gerais", multiline: true },
          ]}
          onCreate={(d) => createTemplate.mutate(d as any)}
          onUpdate={(d) => updateTemplate.mutate(d)}
          onRemove={(id) => removeTemplate.mutate(id)}
        />
      ) : (
        <>
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
                const leadName = (c as any).client_name || (c.proposals as any)?.leads?.name || "—";
                return (
                  <Card key={c.id} className="shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{(c as any).contract_number || "—"}</p>
                          <p className="font-semibold text-sm">{leadName}</p>
                          <p className="text-xs text-muted-foreground">{c.address ? `${c.address}${c.city ? `, ${c.city}` : ""}` : "Sem endereço"}</p>
                        </div>
                        <Badge variant={c.status === "assinado" ? "default" : "secondary"}>{statusLabels[c.status] || c.status}</Badge>
                      </div>
                      <div className="text-sm font-bold">{formatCurrency(c.value)}</div>
                      <div className="flex gap-1 pt-1 flex-wrap">
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => remove.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                        {c.status === "rascunho" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={() => update.mutate({ id: c.id, status: "enviado", sent_at: new Date().toISOString() })}>
                            <Send className="h-3 w-3 mr-1" /> Enviar
                          </Button>
                        )}
                        {(c.status === "rascunho" || c.status === "enviado") && (
                          <>
                            <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => signAndCreateProject.mutate(c)} disabled={signAndCreateProject.isPending}>
                              <FileSignature className="h-3 w-3 mr-1" /> Assinar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCancelOpen(c.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
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
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader><DialogTitle>{editingContract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh] pr-2">
            {/* Left: Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Proposta Aprovada *</Label>
                <Select value={formData.proposal_id} onValueChange={handleSelectProposal}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma proposta" /></SelectTrigger>
                  <SelectContent>
                    {approvedProposals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{(p.leads as any)?.name || "Lead"} — {formatCurrency((p as any).final_value || p.value)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Template de Contrato</Label>
                <Select value={formData.template_id} onValueChange={(v) => setFormData({ ...formData, template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.is_active).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <h3 className="font-semibold text-sm border-b pb-1">Dados do Contratante</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF/CNPJ</Label>
                  <Input value={formData.client_cpf_cnpj} onChange={(e) => setFormData({ ...formData, client_cpf_cnpj: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={formData.client_email} onChange={(e) => setFormData({ ...formData, client_email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={formData.client_phone} onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Endereço do Contratante</Label>
                  <Input value={formData.client_address} onChange={(e) => setFormData({ ...formData, client_address: e.target.value })} />
                </div>
              </div>

              <h3 className="font-semibold text-sm border-b pb-1">Dados da Obra</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Endereço</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Bairro</Label>
                  <Input value={formData.construction_neighborhood} onChange={(e) => setFormData({ ...formData, construction_neighborhood: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cidade</Label>
                  <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
              </div>

              <h3 className="font-semibold text-sm border-b pb-1">Serviços e Valores</h3>
              <div className="space-y-1.5">
                <Label>Descrição dos Serviços</Label>
                <Textarea value={formData.service_description} onChange={(e) => setFormData({ ...formData, service_description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valor (R$)</Label>
                  <Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Início</Label>
                  <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Condições de Pagamento</Label>
                  <Input value={formData.payment_conditions} onChange={(e) => setFormData({ ...formData, payment_conditions: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Prazo Estimado</Label>
                  <Input value={formData.estimated_duration} onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Cláusulas Específicas</Label>
                <Textarea value={formData.custom_clauses} onChange={(e) => setFormData({ ...formData, custom_clauses: e.target.value })} rows={3} />
              </div>

              <div className="space-y-1.5">
                <Label>Observações Internas</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={!formData.proposal_id || create.isPending || update.isPending}>
                  {editingContract ? "Salvar" : "Criar Contrato"}
                </Button>
              </div>
            </div>

            {/* Right: Preview */}
            <ContractPreview
              contractNumber={editingContract ? ((editingContract as any).contract_number || "") : generateContractNumber(contracts)}
              clientName={formData.client_name}
              clientCpfCnpj={formData.client_cpf_cnpj}
              clientEmail={formData.client_email}
              clientPhone={formData.client_phone}
              clientAddress={formData.client_address}
              constructionAddress={formData.address}
              constructionCity={formData.city}
              constructionNeighborhood={formData.construction_neighborhood}
              serviceDescription={formData.service_description}
              value={Number(formData.value) || null}
              paymentConditions={formData.payment_conditions}
              paymentMethod={formData.payment_method}
              startDate={formData.start_date}
              estimatedDuration={formData.estimated_duration}
              customClauses={formData.custom_clauses}
              template={selectedTemplate}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelOpen} onOpenChange={() => setCancelOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar Contrato</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Motivo do cancelamento</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCancelOpen(null)}>Voltar</Button>
            <Button variant="destructive" onClick={() => handleCancel(cancelOpen!)}>Cancelar Contrato</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
