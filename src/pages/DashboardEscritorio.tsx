import { useState } from "react";
import { Link } from "react-router-dom";
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
import { C } from "@/lib/chartColors";
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
  fechados:    { label: "Fechados",     color: C.navy      },
  propostas:   { label: "Propostas",    color: C.terra     },
  em_andamento:{ label: "Em andamento", color: C.navyFaint },
};

const financeiroConfig: ChartConfig = {
  receita: { label: "Receita", color: C.navy    },
  despesa: { label: "Despesa", color: C.terra   },
  margem:  { label: "Margem",  color: C.success },
};

/* ── border-left color getter for oportunidades ── */
function oportBorderColor(days: number) {
  if (days >= 7) return C.danger;
  if (days >= 3) return C.warning;
  return C.success;
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
      <div className="space-y-5">
        <SegmentedTabs tab={tab} onChange={setTab} />
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
    <div className="space-y-5">
      <SegmentedTabs tab={tab} onChange={setTab} />

      {/* ═══════════════════ ABA COMERCIAL ═══════════════════ */}
      {tab === "comercial" && cm && (
        <div className="space-y-4">
          {/* BLOCO 1 — Funil comercial (redesign Sprint 7).
              Barras horizontais proporcionais para mostrar volume e
              perda entre etapas mesmo quando os números são pequenos.
              Inclui métricas globais inline. */}
          <Card>
            <CardContent className="pt-5 pb-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Funil comercial — {capMonth}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Conversão total: <strong className="text-foreground tabular-nums">{cm.conversaoTotal}%</strong>
                  </span>
                  <span>
                    Ticket médio: <strong className="text-foreground tabular-nums">{fmt(cm.ticketMedio)}</strong>
                  </span>
                </div>
              </div>

              {(() => {
                const maxCount = Math.max(...cm.funil.map((s) => s.count), 1);
                return (
                  <div className="space-y-2">
                    {cm.funil.map((stage, i) => {
                      const widthPct = Math.max(8, (stage.count / maxCount) * 100);
                      const conversionFromPrev = i > 0 ? cm.funnelRates[i - 1] : null;
                      return (
                        <div key={stage.label} className="flex items-center gap-3">
                          <div className="w-32 shrink-0 text-xs">
                            <p className="font-medium text-foreground">{stage.label}</p>
                            {conversionFromPrev != null && (
                              <p className="text-[10px] text-muted-foreground">
                                {conversionFromPrev}% da etapa anterior
                              </p>
                            )}
                          </div>
                          <div className="flex-1 relative h-9 rounded-md overflow-hidden bg-muted/40">
                            <div
                              className="absolute inset-y-0 left-0 transition-all"
                              style={{
                                width: `${widthPct}%`,
                                background: `linear-gradient(90deg, ${stage.color}25 0%, ${stage.color}40 100%)`,
                                borderLeft: `3px solid ${stage.color}`,
                              }}
                            />
                            <div className="absolute inset-0 flex items-center px-3 gap-2">
                              <span className="text-lg font-display tabular-nums" style={{ color: stage.color }}>
                                {stage.count}
                              </span>
                              {stage.count > 0 && cm.funil[0].count > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  ({Math.round((stage.count / cm.funil[0].count) * 100)}% do topo)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* BLOCO 2 — KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              icon={<Users className="h-4 w-4" />}
              label="Leads este mês"
              value={String(cm.kpis.leadsThisMonth)}
              variation={cm.kpis.leadsVariation}
            />
            <KpiCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Taxa de conversão"
              value={`${cm.kpis.taxaConversao}%`}
              variation={cm.kpis.taxaVariation}
              variationSuffix="pp"
            />
            <KpiCard
              icon={<Clock className="h-4 w-4" />}
              label="Tempo médio fechamento"
              value={`${cm.kpis.tempoMedioFechamento}d`}
            />
            <KpiCard
              icon={<Send className="h-4 w-4" />}
              label="Propostas aguardando"
              value={String(cm.kpis.proposalsAguardando)}
              badge={cm.kpis.hasUrgent ? { label: "+7d", variant: "destructive" } : undefined}
            />
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
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Nenhuma oportunidade no momento</p>
                    <Link to="/leads/pipeline" className="text-sm font-medium text-primary hover:underline">
                      Adicionar lead →
                    </Link>
                  </div>
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-display">Pipeline — últimos 6 meses</CardTitle>
                <div className="flex items-center gap-3">
                  {[
                    { label: "Fechados",     color: C.navy      },
                    { label: "Propostas",    color: C.terra     },
                    { label: "Em andamento", color: C.navyFaint },
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
                  <Bar dataKey="fechados"     stackId="a" fill={C.navy}      radius={[0, 0, 0, 0]} />
                  <Bar dataKey="propostas"   stackId="a" fill={C.terra}     />
                  <Bar dataKey="em_andamento" stackId="a" fill={C.navyFaint} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════ ABA FINANCEIRO ═══════════════════ */}
      {tab === "financeiro" && fm && (
        <div className="space-y-4">
          {/* BLOCO 1 — KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              icon={<Wallet className="h-4 w-4" />}
              label={`Receita — ${capMonth}`}
              value={fmt(fm.kpis.receitaMes)}
              variation={fm.kpis.receitaVariation}
              accent={C.navy}
            />
            <KpiCard
              icon={<Calendar className="h-4 w-4" />}
              label="A receber (30 dias)"
              value={fmt(fm.kpis.aReceber30d)}
              accent={C.success}
              hint={`${fm.kpis.aReceber30dCount} pagamento(s) pendente(s)`}
            />
            <KpiCard
              icon={<ArrowDown className="h-4 w-4" />}
              label={`Despesas — ${capMonth}`}
              value={fmt(fm.kpis.despesasMes)}
              variation={fm.kpis.despesaVariation}
              variationInvert
              accent={C.terra}
              hint={
                fm.pendingNFs > 0 ? (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <FileText className="h-3 w-3" />
                    {fm.pendingNFs} NF(s) pendente(s)
                  </span>
                ) : undefined
              }
            />
            <KpiCard
              icon={<Target className="h-4 w-4" />}
              label="Margem líquida"
              value={`${fm.kpis.margemLiquida}%`}
              accent={C.success}
              hint={
                <span>
                  Meta: 60% ·{" "}
                  {fm.kpis.margemLiquida >= 60 ? (
                    <span className="text-emerald-600 font-medium">superada</span>
                  ) : (
                    <span className="text-red-500 font-medium">abaixo da meta</span>
                  )}
                </span>
              }
            />
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
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Nenhum recebimento nos próximos 30 dias</p>
                    <Link to="/admin/invoices" className="text-sm font-medium text-primary hover:underline">
                      Registrar pagamento →
                    </Link>
                  </div>
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-display">Receita vs Despesa — últimos 6 meses</CardTitle>
                <div className="flex items-center gap-3">
                  {[
                    { label: "Receita", color: C.navy    },
                    { label: "Despesa", color: C.terra   },
                    { label: "Margem",  color: C.success },
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
                  <Bar yAxisId="left" dataKey="receita" fill={C.navy}    radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="despesa" fill={C.terra}   radius={[4, 4, 0, 0]} barSize={20} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="margem"
                    stroke={C.success}
                    strokeWidth={2}
                    dot={{ r: 3, fill: C.success }}
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

function SegmentedTabs({
  tab,
  onChange,
}: {
  tab: "comercial" | "financeiro";
  onChange: (t: "comercial" | "financeiro") => void;
}) {
  return (
    <div className="inline-flex p-1 bg-muted/50 rounded-lg">
      {(["comercial", "financeiro"] as const).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-5 py-1.5 text-sm font-medium rounded-md transition-all ${
            tab === t
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t === "comercial" ? "Comercial" : "Financeiro"}
        </button>
      ))}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  variation,
  variationSuffix = "%",
  variationInvert = false,
  accent,
  badge,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variation?: number;
  variationSuffix?: string;
  variationInvert?: boolean;
  accent?: string;
  badge?: { label: string; variant?: "default" | "destructive" | "outline" };
  hint?: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden">
      {accent && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px]"
          style={{ background: accent }}
        />
      )}
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {variation !== undefined && (
            <VariationBadge value={variation} suffix={variationSuffix} invert={variationInvert} />
          )}
          {badge && (
            <Badge variant={badge.variant ?? "outline"} className="text-[10px] px-1.5 py-0">
              {badge.label}
            </Badge>
          )}
        </div>
        {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

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
