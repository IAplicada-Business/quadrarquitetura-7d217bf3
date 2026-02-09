import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, FileText, Check, X, Copy, Send, Sparkles, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProposals, Proposal } from "@/hooks/useProposals";
import { useLeads, Lead } from "@/hooks/useLeads";
import { useProposalTemplates } from "@/hooks/useProposalTemplates";
import { ProposalPreview } from "@/components/leads/ProposalPreview";
import { TemplateManager } from "@/components/leads/TemplateManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = {
  rascunho: "Rascunho", enviada: "Enviada", aprovada: "Aprovada", rejeitada: "Rejeitada",
};

function formatCurrency(v: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function generateProposalNumber(proposals: Proposal[]): string {
  const year = new Date().getFullYear();
  const thisYear = proposals.filter(p => p.proposal_number?.startsWith(`PROP-${year}`));
  const seq = thisYear.length + 1;
  return `PROP-${year}-${String(seq).padStart(3, "0")}`;
}

export default function LeadsProposals() {
  const navigate = useNavigate();
  const { proposals, isLoading, create, update, remove } = useProposals();
  const { leads } = useLeads();
  const { templates, create: createTemplate, update: updateTemplate, remove: removeTemplate } = useProposalTemplates();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("lista");

  const [formData, setFormData] = useState({
    lead_id: "", template_id: "", title: "", project_description: "", value: "",
    discount_percent: "", estimated_area: "", estimated_duration: "", deadline: "",
    payment_conditions: "", payment_method: "", notes: "", custom_services: "",
    includes_architectural_project: true, includes_construction_management: true,
    includes_interior_design: false, includes_3d_visualization: false,
  });

  const selectedLead = leads.find(l => l.id === formData.lead_id);
  const selectedTemplate = templates.find(t => t.id === formData.template_id);

  const openNew = () => {
    setEditingProposal(null);
    setFormData({
      lead_id: "", template_id: "", title: "", project_description: "", value: "",
      discount_percent: "", estimated_area: "", estimated_duration: "", deadline: "",
      payment_conditions: "", payment_method: "", notes: "", custom_services: "",
      includes_architectural_project: true, includes_construction_management: true,
      includes_interior_design: false, includes_3d_visualization: false,
    });
    setFormOpen(true);
  };

  const openEdit = (p: Proposal) => {
    setEditingProposal(p);
    setFormData({
      lead_id: p.lead_id, template_id: (p as any).template_id || "",
      title: (p as any).title || "", project_description: p.project_description || "",
      value: p.value?.toString() || "", discount_percent: p.discount_percent?.toString() || "",
      estimated_area: (p as any).estimated_area?.toString() || "",
      estimated_duration: (p as any).estimated_duration || "",
      deadline: p.deadline || "", payment_conditions: p.payment_conditions || "",
      payment_method: (p as any).payment_method || "", notes: (p as any).notes || "",
      custom_services: (p as any).custom_services || "",
      includes_architectural_project: (p as any).includes_architectural_project ?? true,
      includes_construction_management: (p as any).includes_construction_management ?? true,
      includes_interior_design: (p as any).includes_interior_design ?? false,
      includes_3d_visualization: (p as any).includes_3d_visualization ?? false,
    });
    setFormOpen(true);
  };

  const calcFinalValue = () => {
    const v = Number(formData.value) || 0;
    const d = Number(formData.discount_percent) || 0;
    return v - (v * d / 100);
  };

  const handleGenerateAI = async () => {
    if (!formData.lead_id) { toast({ title: "Selecione um lead primeiro", variant: "destructive" }); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-proposal", {
        body: {
          leadName: selectedLead?.name,
          projectType: selectedLead?.project_type,
          constructionType: (selectedLead as any)?.construction_type,
          templateIntroduction: selectedTemplate?.introduction,
          templateMethodology: selectedTemplate?.methodology,
          templateDifferentials: selectedTemplate?.differentials,
          services: {
            architectural: formData.includes_architectural_project,
            construction: formData.includes_construction_management,
            interior: formData.includes_interior_design,
            visualization: formData.includes_3d_visualization,
            custom: formData.custom_services,
          },
          estimatedArea: formData.estimated_area,
          value: formData.value,
          paymentConditions: formData.payment_conditions,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFormData({ ...formData, project_description: data.text });
      toast({ title: "Texto gerado com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro ao gerar com IA", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.lead_id) return;
    const finalVal = calcFinalValue();
    const payload: Record<string, unknown> = {
      lead_id: formData.lead_id,
      template_id: formData.template_id || null,
      title: formData.title || null,
      project_description: formData.project_description || null,
      value: formData.value ? Number(formData.value) : null,
      discount_percent: formData.discount_percent ? Number(formData.discount_percent) : null,
      final_value: finalVal > 0 ? finalVal : null,
      estimated_area: formData.estimated_area ? Number(formData.estimated_area) : null,
      estimated_duration: formData.estimated_duration || null,
      deadline: formData.deadline || null,
      payment_conditions: formData.payment_conditions || null,
      payment_method: formData.payment_method || null,
      notes: formData.notes || null,
      custom_services: formData.custom_services || null,
      includes_architectural_project: formData.includes_architectural_project,
      includes_construction_management: formData.includes_construction_management,
      includes_interior_design: formData.includes_interior_design,
      includes_3d_visualization: formData.includes_3d_visualization,
    };
    if (editingProposal) {
      update.mutate({ id: editingProposal.id, ...payload });
    } else {
      const num = generateProposalNumber(proposals);
      create.mutate({ ...payload, proposal_number: num } as any);
    }
    setFormOpen(false);
  };

  const handleReject = (id: string) => {
    update.mutate({ id, status: "rejeitada", rejected_at: new Date().toISOString(), rejection_reason: rejectReason });
    setRejectOpen(null);
    setRejectReason("");
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab(activeTab === "templates" ? "lista" : "templates")}>
            <Settings2 className="h-4 w-4 mr-1" /> Templates
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nova Proposta</Button>
        </div>
      </div>

      {activeTab === "templates" ? (
        <TemplateManager
          title="Templates de Proposta"
          templates={templates}
          fields={[
            { key: "introduction", label: "Introdução", multiline: true },
            { key: "methodology", label: "Metodologia", multiline: true },
            { key: "differentials", label: "Diferenciais", multiline: true },
            { key: "terms", label: "Termos e Condições", multiline: true },
            { key: "footer", label: "Rodapé", multiline: true },
          ]}
          onCreate={(d) => createTemplate.mutate(d as any)}
          onUpdate={(d) => updateTemplate.mutate(d)}
          onRemove={(id) => removeTemplate.mutate(id)}
        />
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
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
                        <p className="text-xs text-muted-foreground">{(p as any).proposal_number || "—"}</p>
                        <p className="font-semibold text-sm">{(p as any).title || (p.leads as any)?.name || "Lead"}</p>
                      </div>
                      <Badge variant={p.status === "aprovada" ? "default" : p.status === "rejeitada" ? "destructive" : "secondary"}>
                        {statusLabels[p.status] || p.status}
                      </Badge>
                    </div>
                    {p.project_description && <p className="text-sm text-muted-foreground line-clamp-2">{p.project_description}</p>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold">{formatCurrency((p as any).final_value || p.value)}</span>
                      {p.discount_percent != null && p.discount_percent > 0 && <span className="text-muted-foreground">{p.discount_percent}% desc.</span>}
                    </div>
                    <div className="flex gap-1 pt-1 flex-wrap">
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => remove.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button>
                      {p.status === "rascunho" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={() => update.mutate({ id: p.id, status: "enviada", sent_at: new Date().toISOString() })}>
                          <Send className="h-3 w-3 mr-1" /> Enviar
                        </Button>
                      )}
                      {p.status === "enviada" && (
                        <>
                          <Button size="sm" variant="default" className="h-7 text-xs ml-auto" onClick={() => update.mutate({ id: p.id, status: "aprovada", approved_at: new Date().toISOString() })}>
                            <Check className="h-3 w-3 mr-1" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setRejectOpen(p.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {p.status === "aprovada" && (
                        <Button size="sm" variant="secondary" className="h-7 text-xs ml-auto" onClick={() => navigate("/leads/contracts")}>
                          Gerar Contrato
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader><DialogTitle>{editingProposal ? "Editar Proposta" : "Nova Proposta"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh] pr-2">
            {/* Left: Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Lead *</Label>
                <Select value={formData.lead_id} onValueChange={(v) => setFormData({ ...formData, lead_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um lead" /></SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name} — {l.phone}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Template</Label>
                <Select value={formData.template_id} onValueChange={(v) => setFormData({ ...formData, template_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.is_active).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Título da Proposta</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Projeto Residencial Vila Nova" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Descrição dos Serviços</Label>
                  <Button size="sm" variant="outline" onClick={handleGenerateAI} disabled={generating}>
                    <Sparkles className="h-3 w-3 mr-1" /> {generating ? "Gerando..." : "Gerar com IA"}
                  </Button>
                </div>
                <Textarea value={formData.project_description} onChange={(e) => setFormData({ ...formData, project_description: e.target.value })} rows={5} />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Serviços Inclusos</Label>
                <div className="space-y-2">
                  {[
                    { key: "includes_architectural_project", label: "Projeto Arquitetônico" },
                    { key: "includes_construction_management", label: "Acompanhamento de Obra" },
                    { key: "includes_interior_design", label: "Design de Interiores" },
                    { key: "includes_3d_visualization", label: "Visualização 3D" },
                  ].map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <Switch
                        checked={formData[s.key as keyof typeof formData] as boolean}
                        onCheckedChange={(v) => setFormData({ ...formData, [s.key]: v })}
                      />
                      <span className="text-sm">{s.label}</span>
                    </div>
                  ))}
                  <Input
                    placeholder="Serviços adicionais..."
                    value={formData.custom_services}
                    onChange={(e) => setFormData({ ...formData, custom_services: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Área (m²)</Label>
                  <Input type="number" value={formData.estimated_area} onChange={(e) => setFormData({ ...formData, estimated_area: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Prazo Estimado</Label>
                  <Input value={formData.estimated_duration} onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })} placeholder="Ex: 6 meses" />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor (R$)</Label>
                  <Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Desconto (%)</Label>
                  <Input type="number" value={formData.discount_percent} onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })} />
                </div>
              </div>

              {(Number(formData.value) > 0) && (
                <p className="text-sm font-semibold">Valor final: {formatCurrency(calcFinalValue())}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Condições de Pagamento</Label>
                  <Input value={formData.payment_conditions} onChange={(e) => setFormData({ ...formData, payment_conditions: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Forma de Pagamento</Label>
                  <Input value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} placeholder="Pix, boleto..." />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Validade da Proposta</Label>
                <Input value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} placeholder="30 dias" />
              </div>

              <div className="space-y-1.5">
                <Label>Observações Internas</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={!formData.lead_id || create.isPending || update.isPending}>
                  {editingProposal ? "Salvar" : "Criar Proposta"}
                </Button>
              </div>
            </div>

            {/* Right: Preview */}
            <ProposalPreview
              proposalNumber={editingProposal ? ((editingProposal as any).proposal_number || "") : generateProposalNumber(proposals)}
              leadName={selectedLead?.name || ""}
              title={formData.title}
              projectDescription={formData.project_description}
              services={{
                architectural: formData.includes_architectural_project,
                construction: formData.includes_construction_management,
                interior: formData.includes_interior_design,
                visualization: formData.includes_3d_visualization,
                custom: formData.custom_services,
              }}
              value={Number(formData.value) || null}
              discountPercent={Number(formData.discount_percent) || null}
              finalValue={calcFinalValue() > 0 ? calcFinalValue() : null}
              paymentConditions={formData.payment_conditions}
              paymentMethod={formData.payment_method}
              deadline={formData.deadline || formData.estimated_duration}
              estimatedArea={Number(formData.estimated_area) || null}
              templateIntroduction={selectedTemplate?.introduction || ""}
              templateMethodology={selectedTemplate?.methodology || ""}
              templateDifferentials={selectedTemplate?.differentials || ""}
              templateTerms={selectedTemplate?.terms || ""}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectOpen} onOpenChange={() => setRejectOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar Proposta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Motivo da rejeição</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectOpen(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleReject(rejectOpen!)}>Rejeitar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
