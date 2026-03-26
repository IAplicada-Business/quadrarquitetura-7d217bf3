import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useProposalAssets } from "@/hooks/useProposalAssets";
import { useLeads } from "@/hooks/useLeads";
import { Eye, FileText, Save } from "lucide-react";

export interface ProposalFormData {
  lead_id: string;
  client_name: string;
  project_name: string;
  project_type: string;
  scope_description: string;
  services_included: string;
  timeline_briefing: number;
  timeline_study: number;
  timeline_priorities: number;
  timeline_construction: number;
  price_full: number | null;
  price_cash: number | null;
  installments_count: number | null;
  installment_entry: number | null;
  installment_value: number | null;
  price_note: string;
  portfolio_projects: string[];
  feedback_items: string[];
  ambientes: string[];
  total_area: number | null;
  etapas_ativas: string[];
}

const ALL_ETAPAS = [
  "Briefing",
  "Estudo Preliminar",
  "Anteprojeto",
  "Orçamento Executivo",
  "Reunião de Prioridades",
  "Mobilização de Obra",
  "Conferência e Fiscalização de Obra",
];

const DEFAULT_SCOPE = `Nosso papel será desenvolver o **projeto executivo** dos espaços definidos com todos os desenhos necessários para a realização da obra, considerando todas as ideias discutidas e aprovadas pelo cliente. Dando seguimento com **o gerenciamento**, que inclui a administração de todos os fornecedores envolvidos, cronograma, gestão de pagamentos, vistorias e conferências. Damos assistência no pós obra para garantir que tudo segue funcionando como entregue ou se necessário algum ajuste.`;

const DEFAULT_PRICE_NOTE = "*Neste valor, não está incluso execução de obra (mão de obra e materiais)";

interface Props {
  initialData?: Partial<ProposalFormData>;
  onSave: (data: ProposalFormData, status: string) => void;
  onPreview: (data: ProposalFormData) => void;
  onGeneratePdf: (data: ProposalFormData) => void;
  saving?: boolean;
}

export default function ProposalFormNew({ initialData, onSave, onPreview, onGeneratePdf, saving }: Props) {
  const { leads } = useLeads();
  const { portfolio, feedbacks } = useProposalAssets();

  const [data, setData] = useState<ProposalFormData>({
    lead_id: initialData?.lead_id || "",
    client_name: initialData?.client_name || "",
    project_name: initialData?.project_name || "",
    project_type: initialData?.project_type || "residencial",
    scope_description: initialData?.scope_description || DEFAULT_SCOPE,
    services_included: initialData?.services_included || "ambos",
    timeline_briefing: initialData?.timeline_briefing ?? 4,
    timeline_study: initialData?.timeline_study ?? 15,
    timeline_priorities: initialData?.timeline_priorities ?? 7,
    timeline_construction: initialData?.timeline_construction ?? 25,
    price_full: initialData?.price_full ?? null,
    price_cash: initialData?.price_cash ?? null,
    installments_count: initialData?.installments_count ?? null,
    installment_entry: initialData?.installment_entry ?? null,
    installment_value: initialData?.installment_value ?? null,
    price_note: initialData?.price_note || DEFAULT_PRICE_NOTE,
    portfolio_projects: initialData?.portfolio_projects || [],
    feedback_items: initialData?.feedback_items || [],
    ambientes: initialData?.ambientes || [],
    total_area: initialData?.total_area ?? null,
  });

  const set = <K extends keyof ProposalFormData>(key: K, val: ProposalFormData[K]) =>
    setData(prev => ({ ...prev, [key]: val }));

  // Auto-calc installment value
  const calcInstallmentValue = useMemo(() => {
    if (!data.price_full || !data.installments_count || !data.installment_entry || data.installments_count <= 1) return null;
    return (data.price_full - data.installment_entry) / (data.installments_count - 1);
  }, [data.price_full, data.installments_count, data.installment_entry]);

  // Auto-fill client name from lead
  const handleLeadChange = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    setData(prev => ({
      ...prev,
      lead_id: leadId,
      client_name: lead?.name || prev.client_name,
    }));
  };

  // Portfolio groups
  const portfolioGroups = useMemo(() => {
    const groups = new Map<string, typeof portfolio>();
    portfolio.forEach(p => {
      const key = p.project_name || "Sem nome";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });
    return groups;
  }, [portfolio]);

  const togglePortfolioProject = (projectName: string) => {
    setData(prev => ({
      ...prev,
      portfolio_projects: prev.portfolio_projects.includes(projectName)
        ? prev.portfolio_projects.filter(p => p !== projectName)
        : [...prev.portfolio_projects, projectName],
    }));
  };

  const toggleFeedback = (id: string) => {
    setData(prev => ({
      ...prev,
      feedback_items: prev.feedback_items.includes(id)
        ? prev.feedback_items.filter(f => f !== id)
        : [...prev.feedback_items, id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Client */}
      <Card>
        <CardHeader><CardTitle className="text-base">1. Dados do Cliente</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Lead vinculado *</Label>
            <Select value={data.lead_id} onValueChange={handleLeadChange}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.name} — {l.phone}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nome do cliente *</Label>
            <Input value={data.client_name} onChange={e => set("client_name", e.target.value)} placeholder="Ex: Renata Pacheco" />
          </div>
          <div className="space-y-1.5">
            <Label>Nome do projeto *</Label>
            <Input value={data.project_name} onChange={e => set("project_name", e.target.value)} placeholder="Ex: Beauty House" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de projeto</Label>
            <Select value={data.project_type} onValueChange={v => set("project_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="residencial">Residencial</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="saude">Saúde</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Scope */}
      <Card>
        <CardHeader><CardTitle className="text-base">2. Escopo do Serviço</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Descrição do escopo</Label>
            <Textarea value={data.scope_description} onChange={e => set("scope_description", e.target.value)} rows={5} />
          </div>
          <div className="space-y-1.5">
            <Label>Serviços inclusos</Label>
            <Select value={data.services_included} onValueChange={v => set("services_included", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="projeto">Projeto Executivo</SelectItem>
                <SelectItem value="gerenciamento">Gerenciamento de Obra</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Ambientes */}
      <Card>
        <CardHeader><CardTitle className="text-base">3. Ambientes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Ambientes contemplados</Label>
            <Textarea
              value={data.ambientes.join("\n")}
              onChange={e => set("ambientes", e.target.value.split("\n").filter(Boolean))}
              rows={5}
              placeholder="Digite os ambientes, um por linha&#10;Ex: Sala de estar&#10;Cozinha&#10;Suíte master"
            />
            <p className="text-xs text-muted-foreground">Um ambiente por linha</p>
          </div>
          <div className="space-y-1.5">
            <Label>Metragem total (m²)</Label>
            <Input
              type="number"
              value={data.total_area ?? ""}
              onChange={e => set("total_area", e.target.value ? Number(e.target.value) : null)}
              placeholder="Ex: 180"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">4. Prazos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Briefing (dias)</Label>
            <Input type="number" value={data.timeline_briefing} onChange={e => set("timeline_briefing", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Estudo preliminar (dias)</Label>
            <Input type="number" value={data.timeline_study} onChange={e => set("timeline_study", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Reunião prioridades (dias)</Label>
            <Input type="number" value={data.timeline_priorities} onChange={e => set("timeline_priorities", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Obra (dias trabalhados)</Label>
            <Input type="number" value={data.timeline_construction} onChange={e => set("timeline_construction", Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Values */}
      <Card>
        <CardHeader><CardTitle className="text-base">5. Valores</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Valor cheio (R$) *</Label>
              <Input type="number" value={data.price_full ?? ""} onChange={e => set("price_full", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor à vista (R$)</Label>
              <Input type="number" value={data.price_cash ?? ""} onChange={e => set("price_cash", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nº de parcelas</Label>
              <Input type="number" value={data.installments_count ?? ""} onChange={e => set("installments_count", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Entrada (R$)</Label>
              <Input type="number" value={data.installment_entry ?? ""} onChange={e => set("installment_entry", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor parcela (R$)</Label>
              <Input type="number" value={calcInstallmentValue?.toFixed(2) ?? data.installment_value ?? ""} readOnly className="bg-muted" />
              {calcInstallmentValue && <p className="text-xs text-muted-foreground">Calculado automaticamente</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nota sobre valores</Label>
            <Textarea value={data.price_note} onChange={e => set("price_note", e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Portfolio & Feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">6. Portfólio e Feedbacks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {portfolioGroups.size > 0 && (
            <div className="space-y-2">
              <Label className="font-semibold">Projetos do portfólio</Label>
              <Button variant="outline" size="sm" onClick={() => setData(prev => ({ ...prev, portfolio_projects: Array.from(portfolioGroups.keys()) }))}>
                Selecionar todos
              </Button>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Array.from(portfolioGroups.entries()).map(([name, items]) => (
                  <div key={name} className="flex items-center gap-2 p-2 border rounded">
                    <Checkbox
                      checked={data.portfolio_projects.includes(name)}
                      onCheckedChange={() => togglePortfolioProject(name)}
                    />
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{items.length} fotos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedbacks.length > 0 && (
            <div className="space-y-2">
              <Label className="font-semibold">Feedbacks</Label>
              <Button variant="outline" size="sm" onClick={() => setData(prev => ({ ...prev, feedback_items: feedbacks.map(f => f.id) }))}>
                Selecionar todos
              </Button>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {feedbacks.map(f => (
                  <div key={f.id} className="relative cursor-pointer" onClick={() => toggleFeedback(f.id)}>
                    <img src={f.file_url || ""} alt={f.name} className={`h-24 w-full object-cover rounded border-2 ${data.feedback_items.includes(f.id) ? "border-primary" : "border-transparent"}`} />
                    {data.feedback_items.includes(f.id) && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {portfolioGroups.size === 0 && feedbacks.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum asset cadastrado. Acesse Configurações → Proposta para adicionar portfólio e feedbacks.</p>
          )}
        </CardContent>
      </Card>

      {/* Section 6: Actions */}
      <div className="flex gap-3 justify-end sticky bottom-0 bg-background py-4 border-t">
        <Button variant="outline" onClick={() => onSave({ ...data, installment_value: calcInstallmentValue ?? data.installment_value }, "rascunho")} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> Salvar Rascunho
        </Button>
        <Button variant="secondary" onClick={() => onPreview({ ...data, installment_value: calcInstallmentValue ?? data.installment_value })}>
          <Eye className="h-4 w-4 mr-1" /> Preview
        </Button>
        <Button onClick={() => onGeneratePdf({ ...data, installment_value: calcInstallmentValue ?? data.installment_value })} disabled={saving}>
          <FileText className="h-4 w-4 mr-1" /> Gerar PDF
        </Button>
      </div>
    </div>
  );
}
