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

/* ── mock data ─────────────────────────────────── */
const stats = [
  {
    label: "Fluxo de Caixa",
    value: "R$ 42.500",
    icon: TrendingUp,
    trend: "+12%",
    trendUp: true,
    description: "saldo do mês",
  },
  {
    label: "Pagamentos Pendentes",
    value: "R$ 45.800",
    icon: CreditCard,
    trend: "8",
    trendUp: false,
    description: "parcelas esta semana",
  },
  {
    label: "Orçado vs Recebido",
    value: "35%",
    icon: FileText,
    trend: "R$ 303k/870k",
    trendUp: true,
    description: "recebido do total",
  },
  {
    label: "Projetos Ativos",
    value: "5",
    icon: FileText,
    trend: "+2",
    trendUp: true,
    description: "vs. mês anterior",
  },
];

const paymentsMonthlyData = [
  { month: "Jan", recebido: 42000, pendente: 15000 },
  { month: "Fev", recebido: 38000, pendente: 22000 },
  { month: "Mar", recebido: 55000, pendente: 18000 },
  { month: "Abr", recebido: 48000, pendente: 25000 },
  { month: "Mai", recebido: 62000, pendente: 20000 },
  { month: "Jun", recebido: 58000, pendente: 28000 },
];

const paymentsChartConfig: ChartConfig = {
  recebido: { label: "Recebido", color: ROSA.fill1 },
  pendente: { label: "Pendente", color: ROSA.fill3 },
};

const budgetStatusData = [
  { name: "Aprovados", value: 185000, fill: ROSA.fill1 },
  { name: "Pendentes", value: 72000, fill: ROSA.fill2 },
  { name: "Em Cotação", value: 45000, fill: ROSA.fill3 },
  { name: "Rejeitados", value: 12000, fill: ROSA.fill4 },
];

const budgetChartConfig: ChartConfig = {
  Aprovados: { label: "Aprovados", color: ROSA.fill1 },
  Pendentes: { label: "Pendentes", color: ROSA.fill2 },
  "Em Cotação": { label: "Em Cotação", color: ROSA.fill3 },
  Rejeitados: { label: "Rejeitados", color: ROSA.fill4 },
};

const receitaDespesaData = [
  { month: "Jan", receita: 52000, despesa: 38000 },
  { month: "Fev", receita: 48000, despesa: 41000 },
  { month: "Mar", receita: 65000, despesa: 42000 },
  { month: "Abr", receita: 58000, despesa: 45000 },
  { month: "Mai", receita: 72000, despesa: 50000 },
  { month: "Jun", receita: 68000, despesa: 52000 },
];

const receitaDespesaConfig: ChartConfig = {
  receita: { label: "Receitas", color: ROSA.fill1 },
  despesa: { label: "Despesas", color: ROSA.fill3 },
};

const urgentItems = [
  { type: "Pagamento", description: "Gesso Total — vencido há 3 dias", project: "Clínica Saúde+", severity: "high" as const },
  { type: "Orçamento", description: "Cotação de marcenaria sem resposta há 5 dias", project: "Casa Jardins", severity: "medium" as const },
  { type: "Pagamento", description: "Parcela elétrica vence amanhã", project: "Reforma Apto 142", severity: "medium" as const },
];

const leadsDoMes = [
  { status: "Novo", count: 8, color: ROSA.fill1 },
  { status: "Contato Feito", count: 5, color: ROSA.fill2 },
  { status: "Proposta Enviada", count: 3, color: ROSA.fill3 },
  { status: "Fechado", count: 2, color: "hsl(152, 60%, 40%)" },
];

const propostasRecentes = [
  { title: "Reforma Completa Apto 302", client: "Ana Beatriz", status: "enviada", value: 185000 },
  { title: "Projeto Interiores Casa", client: "Roberto Lima", status: "rascunho", value: 95000 },
  { title: "Reforma Comercial Loja", client: "Moda & Estilo", status: "aprovada", value: 220000 },
  { title: "Adequação Escritório", client: "StartupXYZ", status: "rejeitada", value: 45000 },
];

const propostaStatusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: ROSA.fill3 },
  enviada: { label: "Enviada", color: ROSA.fill2 },
  aprovada: { label: "Aprovada", color: "hsl(152, 60%, 40%)" },
  rejeitada: { label: "Rejeitada", color: ROSA.fill4 },
};

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

/* ── componente ────────────────────────────────── */
export default function DashboardEscritorio() {
  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold font-display mb-1">Escritório</h1>
        <p className="text-muted-foreground">Visão administrativa e financeira</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="hover:shadow-md transition-shadow border-l-4"
            style={{ borderLeftColor: ROSA.destaque }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-5 w-5" style={{ color: ROSA.destaque }} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-display" style={{ color: ROSA.textoDestaque }}>{s.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {s.trendUp ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-amber-500" />
                )}
                <span className={`text-xs ${s.trendUp ? "text-emerald-500" : "text-amber-500"}`}>{s.trend}</span>
                <span className="text-xs text-muted-foreground">{s.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas */}
      {urgentItems.length > 0 && (
        <Card style={{ borderColor: ROSA.fill2, backgroundColor: ROSA.fundoSuave }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" style={{ color: ROSA.destaque }} />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/80">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.severity === "high" ? "hsl(0,70%,50%)" : ROSA.destaque }}
                    />
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
        {/* Area Chart — Fluxo de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Fluxo de Pagamentos</CardTitle>
            <CardDescription>Recebido vs Pendente por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={paymentsChartConfig} className="h-[280px] w-full">
              <AreaChart data={paymentsMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

        {/* Pie Chart — Orçamentos por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Orçamentos por Status</CardTitle>
            <CardDescription>Distribuição de valores</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={budgetChartConfig} className="h-[280px] w-full">
              <PieChart>
                <Pie
                  data={budgetStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {budgetStatusData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {budgetStatusData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
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
            <BarChart data={receitaDespesaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
        {/* Leads do Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Leads do Mês</CardTitle>
            <CardDescription>Resumo por status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leadsDoMes.map((l) => (
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
                <span className="text-sm text-muted-foreground">Total do mês</span>
                <span className="text-lg font-bold font-display" style={{ color: ROSA.textoDestaque }}>
                  {leadsDoMes.reduce((s, l) => s + l.count, 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Propostas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Propostas Recentes</CardTitle>
            <CardDescription>Últimas propostas enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {propostasRecentes.map((p, i) => {
                const cfg = propostaStatusConfig[p.status];
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: ROSA.fundoSuave }}>
                        <Send className="h-5 w-5" style={{ color: ROSA.destaque }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.client}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs mb-1" style={{ borderColor: cfg.color, color: cfg.color }}>
                        {cfg.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{fmt(p.value)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
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
                <p className="text-2xl font-bold font-display" style={{ color: ROSA.textoDestaque }}>R$ 870.000</p>
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
                <p className="text-2xl font-bold font-display text-emerald-600">R$ 303.000</p>
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
                <p className="text-2xl font-bold font-display text-amber-600">R$ 128.000</p>
              </div>
              <Package className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
