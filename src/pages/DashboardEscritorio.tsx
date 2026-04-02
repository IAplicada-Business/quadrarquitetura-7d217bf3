import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Line,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Users,
  TrendingUp,
  Clock,
  Send,
  AlertTriangle,
  Wallet,
  ArrowDown,
  ArrowUp,
  Target,
  FileText,
  Calendar,
} from "lucide-react";
import { useComercialMetrics } from "@/hooks/useComercialMetrics";
import { useFinanceiroMetrics } from "@/hooks/useFinanceiroMetrics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── formatters ── */
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

const yFmt = (v: number) =>
  v >= 1000 ? `R$${Math.round(v / 1000)}k` : `R$${v}`;

const pipelineConfig: ChartConfig = {
  fechados: { label: "Fechados", color: "#1B2A4A" },
  propostas: { label: "Propostas", color: "#8B4557" },
  em_andamento: { label: "Em andamento", color: "#C4A882" },
};

const financeiroConfig: ChartConfig = {
  receita: { label: "Receita", color: "#1B2A4A" },
  despesa: { label: "Despesa", color: "#C4756E" },
  margem: { label: "Margem", color: "#3B6D11" },
};

/* ── border-left color getter for oportunidades ── */
function oportBorderColor(days: number) {
  if (days >= 7) return "#E24B4A";
  if (days >= 3) return "#EF9F27";
  return "#1D9E75";
}

export default function DashboardEscritorio() {
  const [tab, setTab] = useState<"comercial" | "financeiro">("comercial");
  const comercial = useComercialMetrics();
  const financeiro = useFinanceiroMetrics();

  const currentMonthLabel = format(new Date(), "MMMM", { locale: ptBR });
  const capMonth = currentMonthLabel.charAt(0).toUpperCase() + currentMonthLabel.slice(1);

  const isLoading = comercial.isLoading || financeiro.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display mb-1">Escritório</h1>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const cm = comercial.data;
  const fm = financeiro.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display mb-1">Escritório</h1>
        <p className="text-muted-foreground">Visão administrativa e financeira</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-0">
          <button
            onClick={() => setTab("comercial")}
            className={`bg-transparent border-none px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
              tab === "comercial"
                ? "border-b-2 border-[#1B2A4A] text-[#1B2A4A]"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Comercial
          </button>
          <button
            onClick={() => setTab("financeiro")}
            className={`bg-transparent border-none px-6 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
              tab === "financeiro"
                ? "border-b-2 border-[#1B2A4A] text-[#1B2A4A]"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Financeiro
          </button>
        </div>
      </div>

      {/* ═══════════════════ ABA COMERCIAL ═══════════════════ */}
      {tab === "comercial" && cm && (
        <div className="space-y-4">
          {/* BLOCO 1 — Funil comercial */}
          <Card className="bg-secondary/50">
            <CardContent className="pt-5 pb-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
                Funil comercial — {capMonth}
              </p>
              <div className="flex items-center justify-between gap-1 flex-wrap">
                {cm.funil.map((stage, i) => (
                  <div key={stage.label} className="flex items-center gap-1">
                    {/* Stage card */}
                    <div
                      className="rounded-lg px-4 py-3 text-center min-w-[80px]"
                      style={{ backgroundColor: stage.color + "18" }}
                    >
                      <p className="text-[22px] font-medium" style={{ color: stage.color }}>
                        {stage.count}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{stage.label}</p>
                    </div>
                    {/* Arrow + rate */}
                    {i < cm.funil.length - 1 && (
                      <div className="flex flex-col items-center px-1">
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground">
                          {cm.funnelRates[i]}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-4 mt-3 text-[11px] text-muted-foreground">
                <span>Conversão total: {cm.conversaoTotal}%</span>
                <span>Ticket médio: {fmt(cm.ticketMedio)}</span>
              </div>
            </CardContent>
          </Card>

          {/* BLOCO 2 — 4 KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Leads este mês */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Leads este mês</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{cm.kpis.leadsThisMonth}</span>
                  <VariationBadge value={cm.kpis.leadsVariation} />
                </div>
              </CardContent>
            </Card>

            {/* Taxa de conversão */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Taxa de conversão</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{cm.kpis.taxaConversao}%</span>
                  <VariationBadge value={cm.kpis.taxaVariation} suffix="pp" />
                </div>
              </CardContent>
            </Card>

            {/* Tempo médio fechamento */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Tempo médio fechamento</span>
                </div>
                <span className="text-2xl font-bold">{cm.kpis.tempoMedioFechamento}d</span>
              </CardContent>
            </Card>

            {/* Propostas aguardando */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Send className="h-4 w-4" />
                  <span className="text-xs font-medium">Propostas aguardando</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{cm.kpis.proposalsAguardando}</span>
                  {cm.kpis.hasUrgent && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      <AlertTriangle className="h-3 w-3 mr-0.5" />
                      +7d
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BLOCO 3 — Oportunidades + Propostas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Oportunidades quentes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Oportunidades quentes</CardTitle>
              </CardHeader>
              <CardContent>
                {cm.oportunidades.length > 0 ? (
                  <div className="space-y-2">
                    {cm.oportunidades.map((o) => (
                      <div
                        key={o.leadId}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        style={{ borderLeftWidth: 3, borderLeftColor: oportBorderColor(o.daysSinceContact) }}
                      >
                        <div>
                          <p className="text-sm font-medium">{o.leadName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{ color: oportBorderColor(o.daysSinceContact) }}
                          >
                            {o.daysSinceContact}d sem contato
                          </Badge>
                          <span className="text-sm font-semibold tabular-nums">{fmt(o.proposalValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhuma proposta aguardando resposta.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Propostas em aberto */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Propostas em aberto</CardTitle>
              </CardHeader>
              <CardContent>
                {cm.propostasAbertas.length > 0 ? (
                  <div className="space-y-2">
                    {cm.propostasAbertas.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">{p.leadName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Enviada há {p.daysSinceSent} dias
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums">{fmt(p.value)}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${p.urgencyColor}`}
                          >
                            {p.urgencyLabel}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        Total em negociação: <strong>{fmt(cm.totalEmNegociacao)}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhuma proposta enviada no momento.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* BLOCO 4 — Pipeline 6 meses */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-display">Pipeline — últimos 6 meses</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-1">Leads por estágio</p>
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { label: "Fechados", color: "#1B2A4A" },
                    { label: "Propostas", color: "#8B4557" },
                    { label: "Em andamento", color: "#C4A882" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pipelineConfig} className="h-[200px] w-full">
                <BarChart data={cm.pipeline6m} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="fechados" stackId="a" fill="#1B2A4A" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="propostas" stackId="a" fill="#8B4557" />
                  <Bar dataKey="em_andamento" stackId="a" fill="#C4A882" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════ ABA FINANCEIRO ═══════════════════ */}
      {tab === "financeiro" && fm && (
        <div className="space-y-4">
          {/* BLOCO 1 — 4 KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Receita escritório */}
            <Card style={{ borderLeft: "3px solid #1B2A4A" }}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs font-medium">Receita — {capMonth}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">{fmt(fm.kpis.receitaMes)}</span>
                  <VariationBadge value={fm.kpis.receitaVariation} />
                </div>
              </CardContent>
            </Card>

            {/* A receber 30d */}
            <Card style={{ borderLeft: "3px solid #1D9E75" }}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">A receber (30 dias)</span>
                </div>
                <span className="text-2xl font-bold tabular-nums">{fmt(fm.kpis.aReceber30d)}</span>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {fm.kpis.aReceber30dCount} pagamento(s) pendente(s)
                </p>
              </CardContent>
            </Card>

            {/* Despesas do mês */}
            <Card style={{ borderLeft: "3px solid #E24B4A" }}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ArrowDown className="h-4 w-4" />
                  <span className="text-xs font-medium">Despesas — {capMonth}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">{fmt(fm.kpis.despesasMes)}</span>
                  <VariationBadge value={fm.kpis.despesaVariation} invert />
                </div>
                {fm.pendingNFs > 0 && (
                  <Badge variant="outline" className="mt-2 text-[10px] text-amber-600 border-amber-300">
                    <FileText className="h-3 w-3 mr-0.5" />
                    {fm.pendingNFs} NF(s) pendente(s)
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Margem líquida */}
            <Card style={{ borderLeft: "3px solid #3B6D11" }}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Target className="h-4 w-4" />
                  <span className="text-xs font-medium">Margem líquida</span>
                </div>
                <span className="text-2xl font-bold tabular-nums">{fm.kpis.margemLiquida}%</span>
                <p className="text-[11px] mt-1">
                  <span className="text-muted-foreground">Meta: 60% · </span>
                  {fm.kpis.margemLiquida >= 60 ? (
                    <span className="text-emerald-600 font-medium">superada</span>
                  ) : (
                    <span className="text-red-500 font-medium">abaixo da meta</span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* BLOCO 2 — Recebimentos + DRE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Próximos recebimentos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Próximos recebimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {fm.proximosRecebimentos.length > 0 ? (
                  <div className="space-y-2">
                    {fm.proximosRecebimentos.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">{r.project}</p>
                          {r.description && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                              {r.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums">{fmt(r.value)}</span>
                          <Badge
                            variant={r.daysLeft <= 3 ? "destructive" : "outline"}
                            className="text-[10px]"
                          >
                            {r.daysLeft}d
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhum recebimento nos próximos 30 dias.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* DRE resumido */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">DRE resumido — {capMonth}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  <DRERow label="Receita bruta" value={fmt(fm.dre.receitaBruta)} />
                  <DRERow
                    label="Despesas operacionais"
                    value={`− ${fmt(fm.dre.despesasOperacionais)}`}
                    className="text-red-500"
                  />
                  <DRERow
                    label={`Impostos estimados (${fm.dre.taxRate}%)`}
                    value={`− ${fmt(fm.dre.impostosEstimados)}`}
                    className="text-red-500"
                  />
                  <Separator className="my-2" />
                  <DRERow
                    label="Resultado líquido"
                    value={fmt(fm.dre.resultadoLiquido)}
                    className="text-emerald-600 text-sm font-semibold"
                    bold
                  />
                  <DRERow
                    label="Margem líquida"
                    value={`${fm.dre.margemLiquida}%`}
                    className="text-emerald-600"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BLOCO 3 — Gráfico receita vs despesa */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-display">Receita vs Despesa</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-1">Últimos 6 meses</p>
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { label: "Receita", color: "#1B2A4A" },
                    { label: "Despesa", color: "#C4756E" },
                    { label: "Margem", color: "#3B6D11" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[10px] text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={financeiroConfig} className="h-[200px] w-full">
                <ComposedChart data={fm.grafico6m} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis yAxisId="left" tickFormatter={yFmt} className="text-xs" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    className="text-xs"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) =>
                          name === "margem" ? `${value}%` : fmt(Number(value))
                        }
                      />
                    }
                  />
                  <Bar yAxisId="left" dataKey="receita" fill="#1B2A4A" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="despesa" fill="#C4756E" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="margem"
                    stroke="#3B6D11"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#3B6D11" }}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ── helpers ── */

function VariationBadge({
  value,
  invert = false,
  suffix = "%",
}: {
  value: number;
  invert?: boolean;
  suffix?: string;
}) {
  if (value === 0) return null;
  const isPositive = invert ? value < 0 : value > 0;
  return (
    <span
      className={`text-xs font-semibold flex items-center gap-0.5 ${
        isPositive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {value > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function DRERow({
  label,
  value,
  className = "",
  bold = false,
}: {
  label: string;
  value: string;
  className?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className={`text-xs ${bold ? "font-semibold" : ""} text-muted-foreground`}>{label}</span>
      <span className={`text-xs tabular-nums ${bold ? "font-semibold text-sm" : ""} ${className}`}>
        {value}
      </span>
    </div>
  );
}
