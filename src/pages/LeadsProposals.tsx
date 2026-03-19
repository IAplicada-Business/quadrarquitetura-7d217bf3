import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, FileText, Check, X, Send, Settings2, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProposals, Proposal } from "@/hooks/useProposals";
import { useLeads } from "@/hooks/useLeads";
import { useProposalTemplates } from "@/hooks/useProposalTemplates";
import { useProposalAssets } from "@/hooks/useProposalAssets";
import { TemplateManager } from "@/components/leads/TemplateManager";
import ProposalFormNew, { ProposalFormData } from "@/components/leads/ProposalFormNew";
import { ProposalPreviewModal } from "@/components/leads/ProposalPreviewModal";
import { buildProposalPages } from "@/components/leads/ProposalPageRenderer";
import { ProposalPageProps } from "@/components/leads/proposal-pages/shared";
import { generateProposalPdf } from "@/lib/generateProposalPdf";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import ReactDOM from "react-dom/client";
import { flushSync } from "react-dom";

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
  const { user } = useAuth();
  const { proposals, isLoading, create, update, remove } = useProposals();
  const { leads } = useLeads();
  const { templates, create: createTemplate, update: updateTemplate, remove: removeTemplate } = useProposalTemplates();
  const { logos, founderPhotos, portfolio, feedbacks, texts, contacts } = useProposalAssets();

  const [view, setView] = useState<"list" | "form" | "templates">("list");
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPages, setPreviewPages] = useState<React.ReactElement[]>([]);
  const [generating, setGenerating] = useState(false);
  const renderContainerRef = useRef<HTMLDivElement>(null);

  // Build shared page props from assets
  const buildPageProps = useCallback((formData: ProposalFormData): ProposalPageProps => {
    const pillarTexts: Record<string, string> = {};
    texts.forEach(t => {
      const key = (t.metadata as any)?.key;
      if (key && t.description) pillarTexts[key] = t.description;
    });

    const diffText = texts.find(t => (t.metadata as any)?.key === "diferenciais");
    const differentials = diffText?.description?.split("|") || [];

    const instagram = contacts.find(c => c.name === "Instagram")?.description;
    const phone1 = contacts.find(c => c.name === "Telefone 1")?.description;
    const phone2 = contacts.find(c => c.name === "Telefone 2")?.description;
    const aboutText = texts.find(t => (t.metadata as any)?.key === "quem_somos")?.description;

    return {
      clientName: formData.client_name,
      projectName: formData.project_name,
      scopeDescription: formData.scope_description,
      servicesIncluded: formData.services_included,
      timelineBriefing: formData.timeline_briefing,
      timelineStudy: formData.timeline_study,
      timelinePriorities: formData.timeline_priorities,
      timelineConstruction: formData.timeline_construction,
      priceFull: formData.price_full,
      priceCash: formData.price_cash,
      installmentsCount: formData.installments_count,
      installmentEntry: formData.installment_entry,
      installmentValue: formData.installment_value,
      priceNote: formData.price_note,
      logoUrl: logos[0]?.file_url || undefined,
      founderPhotos,
      aboutText,
      pillarTexts,
      differentials: differentials.length > 0 ? differentials : undefined,
      contactInstagram: instagram,
      contactPhone1: phone1,
      contactPhone2: phone2,
    };
  }, [logos, founderPhotos, texts, contacts]);

  const buildPages = useCallback((formData: ProposalFormData) => {
    const pageProps = buildPageProps(formData);
    return buildProposalPages({
      data: pageProps,
      portfolioImages: portfolio,
      feedbackImages: feedbacks,
      selectedPortfolioProjects: formData.portfolio_projects,
      selectedFeedbackIds: formData.feedback_items,
    });
  }, [buildPageProps, portfolio, feedbacks]);

  const handleSave = (formData: ProposalFormData, status: string) => {
    const payload: Record<string, unknown> = {
      lead_id: formData.lead_id,
      client_name: formData.client_name,
      project_name: formData.project_name,
      project_type: formData.project_type,
      scope_description: formData.scope_description,
      services_included: formData.services_included,
      timeline_briefing: formData.timeline_briefing,
      timeline_study: formData.timeline_study,
      timeline_priorities: formData.timeline_priorities,
      timeline_construction: formData.timeline_construction,
      price_full: formData.price_full,
      price_cash: formData.price_cash,
      installments_count: formData.installments_count,
      installment_entry: formData.installment_entry,
      installment_value: formData.installment_value,
      price_note: formData.price_note,
      portfolio_projects: formData.portfolio_projects,
      feedback_items: formData.feedback_items,
      value: formData.price_full,
      final_value: formData.price_cash || formData.price_full,
      status,
    };

    if (editingProposal) {
      update.mutate({ id: editingProposal.id, ...payload });
    } else {
      const num = generateProposalNumber(proposals);
      create.mutate({ ...payload, proposal_number: num } as any);
    }
    setView("list");
    setEditingProposal(null);
  };

  const handlePreview = (formData: ProposalFormData) => {
    const pages = buildPages(formData);
    setPreviewPages(pages);
    setPreviewOpen(true);
  };

  const handleGeneratePdf = async (formData: ProposalFormData) => {
    setGenerating(true);
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    const roots: ReactDOM.Root[] = [];

    try {
      const pages = buildPages(formData);
      const pageElements: HTMLDivElement[] = [];

      for (let i = 0; i < pages.length; i++) {
        const pageDiv = document.createElement("div");
        container.appendChild(pageDiv);
        const root = ReactDOM.createRoot(pageDiv);
        flushSync(() => {
          root.render(pages[i]);
        });
        pageElements.push(pageDiv);
        roots.push(root);
      }

      // Wait for all images to load
      const allImages = container.querySelectorAll("img");
      await Promise.all(
        Array.from(allImages).map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
              })
        )
      );

      // Small extra delay for layout
      await new Promise(resolve => setTimeout(resolve, 500));

      const blob = await generateProposalPdf(pages, (_page, index) => {
        return pageElements[index]?.firstElementChild as HTMLElement || null;
      });

      // Download immediately so user gets the file regardless of upload result
      const fileName = `proposta-${formData.client_name?.replace(/\s+/g, "-") || "cliente"}-${Date.now()}.pdf`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();

      // Try uploading to storage
      try {
        const { error: uploadError } = await supabase.storage
          .from("proposal-assets")
          .upload(`pdfs/${fileName}`, blob, { contentType: "application/pdf" });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("proposal-assets").getPublicUrl(`pdfs/${fileName}`);
          if (editingProposal) {
            update.mutate({ id: editingProposal.id, pdf_url: urlData.publicUrl });
          }
        }
      } catch {
        // Upload failed but PDF was downloaded
      }

      handleSave(formData, "rascunho");
      toast({ title: "PDF gerado com sucesso!" });
    } catch (err: any) {
      console.error("Erro ao gerar PDF:", err);
      toast({ title: "Erro ao gerar PDF", description: err.message, variant: "destructive" });
    } finally {
      roots.forEach(r => r.unmount());
      if (container.parentNode) document.body.removeChild(container);
      setGenerating(false);
    }
  };

  const openNew = () => {
    setEditingProposal(null);
    setView("form");
  };

  const openEdit = (p: Proposal) => {
    setEditingProposal(p);
    setView("form");
  };

  const editInitialData = useMemo((): Partial<ProposalFormData> | undefined => {
    if (!editingProposal) return undefined;
    const p = editingProposal as any;
    return {
      lead_id: p.lead_id,
      client_name: p.client_name || p.leads?.name || "",
      project_name: p.project_name || p.title || "",
      project_type: p.project_type || "residencial",
      scope_description: p.scope_description || p.project_description || "",
      services_included: p.services_included || "ambos",
      timeline_briefing: p.timeline_briefing ?? 4,
      timeline_study: p.timeline_study ?? 15,
      timeline_priorities: p.timeline_priorities ?? 7,
      timeline_construction: p.timeline_construction ?? 25,
      price_full: p.price_full || p.value,
      price_cash: p.price_cash,
      installments_count: p.installments_count,
      installment_entry: p.installment_entry,
      installment_value: p.installment_value,
      price_note: p.price_note || "*Neste valor, não está incluso execução de obra (mão de obra e materiais)",
      portfolio_projects: p.portfolio_projects || [],
      feedback_items: p.feedback_items || [],
    };
  }, [editingProposal]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {view !== "list" && (
            <Button variant="ghost" size="sm" className="mb-2" onClick={() => { setView("list"); setEditingProposal(null); }}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
          )}
          <h1 className="text-2xl font-bold text-display">Propostas</h1>
          <p className="text-sm text-muted-foreground">{proposals.length} proposta(s)</p>
        </div>
        {view === "list" && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setView("templates")}>
              <Settings2 className="h-4 w-4 mr-1" /> Templates
            </Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nova Proposta</Button>
          </div>
        )}
      </div>

      {/* Templates view */}
      {view === "templates" && (
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
      )}

      {/* Form view */}
      {view === "form" && (
        <ProposalFormNew
          initialData={editInitialData}
          onSave={handleSave}
          onPreview={handlePreview}
          onGeneratePdf={handleGeneratePdf}
          saving={create.isPending || update.isPending || generating}
        />
      )}

      {/* List view */}
      {view === "list" && (
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
                        <p className="font-semibold text-sm">{(p as any).client_name || (p as any).title || (p.leads as any)?.name || "Lead"}</p>
                        {(p as any).project_name && <p className="text-xs text-muted-foreground">{(p as any).project_name}</p>}
                      </div>
                      <Badge variant={p.status === "aprovada" ? "default" : p.status === "rejeitada" ? "destructive" : "secondary"}>
                        {statusLabels[p.status] || p.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold">{formatCurrency((p as any).price_full || (p as any).final_value || p.value)}</span>
                      {(p as any).pdf_url && (
                        <a href={(p as any).pdf_url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-7"><Download className="h-3 w-3 mr-1" /> PDF</Button>
                        </a>
                      )}
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

      {/* Preview Modal */}
      <ProposalPreviewModal open={previewOpen} onOpenChange={setPreviewOpen} pages={previewPages} />

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

      {/* Hidden render container for PDF */}
      <div ref={renderContainerRef} style={{ position: "fixed", left: "-9999px", top: 0 }} />
    </div>
  );
}
