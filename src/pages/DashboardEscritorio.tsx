import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  FileText,
  UserPlus,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth, subMonths, isBefore, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── paleta rosa escritório ────────────────────── */
const ROSA = {
  destaque: "hsl(350, 65%, 55%)",
  fundoSuave: "hsl(350, 30%, 96%)",
  textoDestaque: "hsl(350, 25%, 35%)",
  fill1: "hsl(350, 65%, 55%)",
  fill2: "hsl(350, 50%, 70%)",
  fill3: "hsl(350, 35%, 80%)",
  fill4: "hsl(20, 70%, 55%)",
};

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

const paymentsChartConfig: ChartConfig = {
  recebido: { label: "Recebido", color: ROSA.fill1 },
  pendente: { label: "Pendente", color: ROSA.fill3 },
};

const budgetChartConfig: ChartConfig = {
  Aprovados: { label: "Aprovados", color: ROSA.fill1 },
  Pendentes: { label: "Pendentes", color: ROSA.fill2 },
  "Em Cotação": { label: "Em Cotação", color: ROSA.fill3 },
  Rejeitados: { label: "Rejeitados", color: ROSA.fill4 },
};

const receitaDespesaConfig: ChartConfig = {
  receita: { label: "Receitas", color: ROSA.fill1 },
  despesa: { label: "Despesas", color: ROSA.fill3 },
};

const propostaStatusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: ROSA.fill3 },
  enviada: { label: "Enviada", color: ROSA.fill2 },
  aprovada: { label: "Aprovada", color: "hsl(152, 60%, 40%)" },
  rejeitada: { label: "Rejeitada", color: ROSA.fill4 },
};

const statusLabelMap: Record<string, string> = {
  novo: "Novo",
  contato_feito: "Contato Feito",
  reuniao_agendada: "Reunião Agendada",
  proposta_enviada: "Proposta Enviada",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

/* ── componente ────────────────────────────────── */
export default function DashboardEscritorio() {
  const { user } = useAuth();
  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  // ── Queries ──
  const { data: projects = [] } = useQuery({
    queryKey: ["dash-esc-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name, status, estimated_budget").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["dash-esc-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("*, projects(name)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: budgetQuotes = [] } = useQuery({
    queryKey: ["dash-esc-budget-quotes"],
    queryFn: async () => {
      const { data } = await supabase.from("budget_quotes").select("id, status, value, created_at, supplier_name, scope_items(discipline)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["dash-esc-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("id, status, name").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ["dash-esc-proposals"],
    queryFn: async () => {
      const { data } = await supabase.from("proposals").select("id, title, status, value, created_at, leads(name)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(4);
      return data ?? [];
    },
    enabled: !!user,
  });

  // ── Computed data ──
  const computed = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status !== "concluido");
    const totalOrcado = activeProjects.reduce((s, p) => s + (p.estimated_budget ?? 0), 0);

    const pagoTotal = payments.filter((p) => p.status === "pago").reduce((s, p) => s + p.value, 0);
    const pagoMesAtual = payments.filter((p) => p.status === "pago" && p.paid_date && p.paid_date >= monthStart && p.paid_date <= monthEnd).reduce((s, p) => s + p.value, 0);

    const pendentesSemana = payments.filter((p) => p.status === "pendente" && p.due_date && p.due_date >= weekStart && p.due_date <= weekEnd);
    const pendentesTotal = pendentesSemana.reduce((s, p) => s + p.value, 0);

    const aReceber = payments.filter((p) => p.status === "pendente").reduce((s, p) => s + p.value, 0);

    const pctRecebido = totalOrcado > 0 ? Math.round((pagoTotal / totalOrcado) * 100) : 0;

    // Alertas
    const pagamentosAtrasados = payments.filter((p) => p.status === "pendente" && p.due_date && p.due_date < todayStr);
    const fiveDaysAgo = format(subMonths(today, 0).setDate(today.getDate() - 5) ? new Date(today.getTime() - 5 * 86400000) : today, "yyyy-MM-dd");
    const orcamentosSemResposta = budgetQuotes.filter((bq) => bq.status === "cotado" && bq.created_at && bq.created_at.slice(0, 10) <= fiveDaysAgo);

    const alertas: { type: string; description: string; project: string; severity: "high" | "medium" }[] = [];
    pagamentosAtrasados.forEach((p) => {
      const projName = (p as any).projects?.name ?? "Projeto";
      alertas.push({ type: "Pagamento", description: `${p.supplier_name ?? p.description ?? "Pagamento"} — vencido`, project: projName, severity: "high" });
    });
    orcamentosSemResposta.forEach((bq) => {
      alertas.push({ type: "Orçamento", description: `Cotação ${bq.supplier_name ?? ""} sem resposta há 5+ dias`, project: (bq as any).scope_items?.discipline ?? "", severity: "medium" });
    });

    // Gráficos — Fluxo de pagamentos por mês (últimos 6 meses)
    const monthLabels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      monthLabels.push(format(subMonths(today, i), "MMM", { locale: ptBR }));
    }
    const paymentsMonthlyData = monthLabels.map((label, i) => {
      const m = subMonths(today, 5 - i);
      const ms = format(startOfMonth(m), "yyyy-MM");
      const recebido = payments.filter((p) => p.status === "pago" && p.paid_date?.startsWith(ms)).reduce((s, p) => s + p.value, 0);
      const pendente = payments.filter((p) => p.status === "pendente" && p.due_date?.startsWith(ms)).reduce((s, p) => s + p.value, 0);
      return { month: label.charAt(0).toUpperCase() + label.slice(1), recebido, pendente };
    });

    // Orçamentos por status (pie)
    const statusMap: Record<string, number> = {};
    budgetQuotes.forEach((bq) => {
      const st = bq.status ?? "pendente";
      statusMap[st] = (statusMap[st] ?? 0) + (bq.value ?? 0);
    });
    const budgetStatusLabels: Record<string, string> = { aprovado: "Aprovados", pendente: "Pendentes", cotado: "Em Cotação", rejeitado: "Rejeitados" };
    const budgetFills: Record<string, string> = { aprovado: ROSA.fill1, pendente: ROSA.fill2, cotado: ROSA.fill3, rejeitado: ROSA.fill4 };
    const budgetStatusData = Object.entries(statusMap).map(([st, val]) => ({
      name: budgetStatusLabels[st] ?? st,
      value: val,
      fill: budgetFills[st] ?? ROSA.fill3,
    }));

    // Receita vs Despesa por mês
    const receitaDespesaData = monthLabels.map((label, i) => {
      const m = subMonths(today, 5 - i);
      const ms = format(startOfMonth(m), "yyyy-MM");
      const receita = payments.filter((p) => p.status === "pago" && p.client_id && p.paid_date?.startsWith(ms)).reduce((s, p) => s + p.value, 0);
      const despesa = payments.filter((p) => p.status === "pago" && p.supplier_id && p.paid_date?.startsWith(ms)).reduce((s, p) => s + p.value, 0);
      return { month: label.charAt(0).toUpperCase() + label.slice(1), receita, despesa };
    });

    // Leads agrupados
    const leadsByStatus: Record<string, number> = {};
    leads.forEach((l) => { leadsByStatus[l.status] = (leadsByStatus[l.status] ?? 0) + 1; });
    const leadsDoMes = Object.entries(leadsByStatus).map(([status, count], i) => ({
      status: statusLabelMap[status] ?? status,
      count,
      color: [ROSA.fill1, ROSA.fill2, ROSA.fill3, "hsl(152, 60%, 40%)"][i % 4],
    }));

    return {
      activeProjects: activeProjects.length,
      pagoMesAtual,
      pendentesCount: pendentesSemana.length,
      pendentesTotal,
      pctRecebido,
      totalOrcado,
      pagoTotal,
      aReceber,
      alertas,
      paymentsMonthlyData,
      budgetStatusData,
      receitaDespesaData,
      leadsDoMes,
    };
  }, [projects, payments, budgetQuotes, leads, monthStart, monthEnd, weekStart, weekEnd, todayStr, today]);

  const stats = [
    { label: "Fluxo de Caixa", value: fmt(computed.pagoMesAtual), icon: TrendingUp, description: "recebido este mês" },
    { label: "Pagamentos Pendentes", value: fmt(computed.pendentesTotal), icon: CreditCard, description: `${computed.pendentesCount} esta semana` },
    { label: "Orçado vs Recebido", value: `${computed.pctRecebido}%`, icon: FileText, description: `${fmt(computed.pagoTotal)} / ${fmt(computed.totalOrcado)}` },
    { label: "Projetos Ativos", value: String(computed.activeProjects), icon: FileText, description: "em andamento" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display mb-1">Escritório</h1>
        <p className="text-muted-foreground">Visão administrativa e financeira</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: ROSA.destaque }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-5 w-5" style={{ color: ROSA.destaque }} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-display" style={{ color: ROSA.textoDestaque }}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas */}
      {computed.alertas.length > 0 && (
        <Card style={{ borderColor: ROSA.fill2, backgroundColor: ROSA.fundoSuave }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" style={{ color: ROSA.destaque }} />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {computed.alertas.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/80">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.severity === "high" ? "hsl(0,70%,50%)" : ROSA.destaque }} />
                    <div>
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.project}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{item.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos — Fluxo + Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Fluxo de Pagamentos</CardTitle>
            <CardDescription>Recebido vs Pendente por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={paymentsChartConfig} className="h-[280px] w-full">
              <AreaChart data={computed.paymentsMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `${v / 1000}k`} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                <Area type="monotone" dataKey="recebido" stackId="1" stroke={ROSA.fill1} fill={ROSA.fill1} fillOpacity={0.6} />
                <Area type="monotone" dataKey="pendente" stackId="1" stroke={ROSA.fill3} fill={ROSA.fill3} fillOpacity={0.6} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Orçamentos por Status</CardTitle>
            <CardDescription>Distribuição de valores</CardDescription>
          </CardHeader>
          <CardContent>
            {computed.budgetStatusData.length > 0 ? (
              <>
                <ChartContainer config={budgetChartConfig} className="h-[280px] w-full">
                  <PieChart>
                    <Pie data={computed.budgetStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {computed.budgetStatusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {computed.budgetStatusData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-xs text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum orçamento registrado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart — Receita vs Despesa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Receitas vs Despesas</CardTitle>
          <CardDescription>Comparativo mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={receitaDespesaConfig} className="h-[280px] w-full">
            <BarChart data={computed.receitaDespesaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis tickFormatter={(v) => `${v / 1000}k`} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
              <Bar dataKey="receita" fill={ROSA.fill1} radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" fill={ROSA.fill3} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ROSA.fill1 }} />
              <span className="text-xs text-muted-foreground">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ROSA.fill3 }} />
              <span className="text-xs text-muted-foreground">Despesas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid inferior — Leads + Propostas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Leads</CardTitle>
            <CardDescription>Resumo por status</CardDescription>
          </CardHeader>
          <CardContent>
            {computed.leadsDoMes.length > 0 ? (
              <div className="space-y-3">
                {computed.leadsDoMes.map((l) => (
                  <div key={l.status} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: ROSA.fundoSuave }}>
                        <UserPlus className="h-5 w-5" style={{ color: l.color }} />
                      </div>
                      <p className="font-medium text-sm">{l.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-display" style={{ color: l.color }}>{l.count}</span>
                      <span className="text-xs text-muted-foreground">leads</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-bold font-display" style={{ color: ROSA.textoDestaque }}>
                    {computed.leadsDoMes.reduce((s, l) => s + l.count, 0)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum lead registrado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Propostas Recentes</CardTitle>
            <CardDescription>Últimas propostas</CardDescription>
          </CardHeader>
          <CardContent>
            {proposals.length > 0 ? (
              <div className="space-y-3">
                {proposals.map((p) => {
                  const cfg = propostaStatusConfig[p.status] ?? { label: p.status, color: ROSA.fill3 };
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: ROSA.fundoSuave }}>
                          <Send className="h-5 w-5" style={{ color: ROSA.destaque }} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.title ?? "Proposta"}</p>
                          <p className="text-xs text-muted-foreground">{(p as any).leads?.name ?? ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs mb-1" style={{ borderColor: cfg.color, color: cfg.color }}>
                          {cfg.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{fmt(p.value ?? 0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhuma proposta registrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card style={{ backgroundColor: ROSA.fundoSuave, borderColor: ROSA.fill3 }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orçado</p>
                <p className="text-2xl font-bold font-display" style={{ color: ROSA.textoDestaque }}>{fmt(computed.totalOrcado)}</p>
              </div>
              <TrendingUp className="h-8 w-8" style={{ color: ROSA.fill2 }} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recebido</p>
                <p className="text-2xl font-bold font-display text-emerald-600">{fmt(computed.pagoTotal)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold font-display text-amber-600">{fmt(computed.aReceber)}</p>
              </div>
              <Package className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
