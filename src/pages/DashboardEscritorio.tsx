import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  UserPlus,
  Send,
  Clock,
  CreditCard,
  Calendar,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── paleta rosa escritório ────────────────────── */
const ROSA = {
  destaque: "hsl(350, 65%, 55%)",
  fundoSuave: "hsl(350, 30%, 96%)",
  textoDestaque: "hsl(350, 25%, 35%)",
  fill1: "hsl(350, 65%, 55%)",
  fill2: "hsl(350, 50%, 70%)",
  fill3: "hsl(350, 35%, 80%)",
};

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

const yAxisFormatter = (v: number) => {
  if (v >= 1000000) return `R$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return `R$${v.toFixed(0)}`;
};

const receitaChartConfig: ChartConfig = {
  receita: { label: "Receita", color: ROSA.fill1 },
};

/* ── hooks consolidados ──────────────────────────── */
function useEscritorioMetrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["escritorio-metrics"],
    queryFn: async () => {
      const [leadsRes, proposalsRes, paymentsRes] = await Promise.all([
        supabase.from("leads").select("id, status, name, created_at, email, phone"),
        supabase.from("proposals").select("id, status, price_full, final_value, approved_at, created_at, sent_at"),
        supabase.from("payments").select("id, value, due_date, status, supplier_name, description, project_id, source, paid_date, projects(name)").eq("source", "escritorio"),
      ]);
      return {
        leads: leadsRes.data ?? [],
        proposals: proposalsRes.data ?? [],
        payments: paymentsRes.data ?? [],
      };
    },
    enabled: !!user,
  });
}

function useEscritorioAlertas() {
  const { user } = useAuth();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  return useQuery({
    queryKey: ["escritorio-alertas"],
    queryFn: async () => {
      const [tasksRes, nfsRes] = await Promise.all([
        supabase.from("schedule_tasks").select("id, end_date, status, task_name, project_id").lt("end_date", todayStr).not("status", "in", "(concluido,executado)"),
        supabase.from("invoices_nf" as any).select("id").eq("status", "pendente"),
      ]);
      return {
        overdueTasks: tasksRes.data ?? [],
        pendingNFs: (nfsRes.data ?? []) as any[],
      };
    },
    enabled: !!user,
  });
}

/* ── componente ────────────────────────────────── */
export default function DashboardEscritorio() {
  const navigate = useNavigate();
  const today = new Date();
  const currentMonth = format(today, "yyyy-MM");
  const prevMonth = format(subMonths(today, 1), "yyyy-MM");

  const { data: metrics, isLoading: metricsLoading } = useEscritorioMetrics();
  const { data: alertas, isLoading: alertasLoading } = useEscritorioAlertas();

  const computed = useMemo(() => {
    if (!metrics) return null;
    const { leads, proposals, payments } = metrics;

    // ── Leads KPIs ──
    const leadsThisMonth = leads.filter((l) => l.created_at?.startsWith(currentMonth)).length;
    const leadsPrevMonth = leads.filter((l) => l.created_at?.startsWith(prevMonth)).length;
    const leadsVariation = leadsPrevMonth > 0 ? Math.round(((leadsThisMonth - leadsPrevMonth) / leadsPrevMonth) * 100) : 0;

    // ── Conversão ──
    const totalLeads = leads.length;
    const convertedLeads = leads.filter((l) => l.status === "fechado").length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // ── Ticket médio ──
    const approvedThisMonth = proposals.filter((p) => p.status === "aprovada" && p.approved_at?.startsWith(currentMonth));
    const approvedPrevMonth = proposals.filter((p) => p.status === "aprovada" && p.approved_at?.startsWith(prevMonth));
    const ticketThis = approvedThisMonth.length > 0 ? approvedThisMonth.reduce((s, p) => s + (p.price_full ?? p.final_value ?? 0), 0) / approvedThisMonth.length : 0;
    const ticketPrev = approvedPrevMonth.length > 0 ? approvedPrevMonth.reduce((s, p) => s + (p.price_full ?? p.final_value ?? 0), 0) / approvedPrevMonth.length : 0;
    const ticketVariation = ticketPrev > 0 ? Math.round(((ticketThis - ticketPrev) / ticketPrev) * 100) : 0;

    // ── Aguardando resposta ──
    const proposalsAwaiting = proposals.filter((p) => p.status === "enviada");
    const hasUrgent = proposalsAwaiting.some((p) => p.sent_at && differenceInDays(today, parseISO(p.sent_at)) > 7);

    // ── Receita últimos 6 meses ──
    const monthLabels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      monthLabels.push(format(subMonths(today, i), "MMM", { locale: ptBR }));
    }
    const receitaChartData = monthLabels.map((label, i) => {
      const m = subMonths(today, 5 - i);
      const ms = format(startOfMonth(m), "yyyy-MM");
      const receita = payments.filter((p) => p.status === "pago" && p.paid_date?.startsWith(ms)).reduce((s, p) => s + p.value, 0);
      return { month: label.charAt(0).toUpperCase() + label.slice(1), receita };
    });

    // ── Próximos recebimentos ──
    const thirtyDaysLater = format(new Date(today.getTime() + 30 * 86400000), "yyyy-MM-dd");
    const todayStr = format(today, "yyyy-MM-dd");
    const upcomingPayments = payments
      .filter((p) => p.status === "pendente" && p.due_date && p.due_date >= todayStr && p.due_date <= thirtyDaysLater)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
      .slice(0, 5)
      .map((p) => ({
        project: (p as any).projects?.name ?? "Projeto",
        value: p.value,
        dueDate: p.due_date!,
        daysLeft: differenceInDays(parseISO(p.due_date!), today),
      }));

    // ── Leads sem follow-up +7d ──
    const sevenDaysAgo = format(new Date(today.getTime() - 7 * 86400000), "yyyy-MM-dd");
    const staleLeads = leads.filter((l) => l.status === "novo" && l.created_at && l.created_at.slice(0, 10) <= sevenDaysAgo);

    return {
      leadsThisMonth,
      leadsVariation,
      conversionRate,
      ticketThis,
      ticketVariation,
      proposalsAwaiting: proposalsAwaiting.length,
      hasUrgentProposal: hasUrgent,
      receitaChartData,
      upcomingPayments,
      staleLeads: staleLeads.length,
    };
  }, [metrics, currentMonth, prevMonth, today]);

  const overdueTasks = alertas?.overdueTasks?.length ?? 0;
  const pendingNFs = alertas?.pendingNFs?.length ?? 0;
  const staleLeads = computed?.staleLeads ?? 0;

  if (metricsLoading || alertasLoading || !computed) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display mb-1">Escritório</h1>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6"><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display mb-1">Escritório</h1>
        <p className="text-muted-foreground">Visão administrativa e financeira</p>
      </div>

      {/* ═══ BLOCO 1 — PULSO COMERCIAL ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads no mês */}
        <Card className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: "hsl(210, 70%, 50%)" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads este Mês</CardTitle>
            <UserPlus className="h-5 w-5" style={{ color: "hsl(210, 70%, 50%)" }} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold font-display" style={{ color: "hsl(210, 50%, 35%)" }}>{computed.leadsThisMonth}</p>
              {computed.leadsVariation !== 0 && (
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${computed.leadsVariation > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {computed.leadsVariation > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(computed.leadsVariation)}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs mês anterior</p>
          </CardContent>
        </Card>

        {/* Taxa de conversão */}
        <Card className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: "hsl(152, 60%, 40%)" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-5 w-5" style={{ color: "hsl(152, 60%, 40%)" }} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-display" style={{ color: "hsl(152, 40%, 30%)" }}>{computed.conversionRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">leads convertidos / total</p>
          </CardContent>
        </Card>

        {/* Ticket médio */}
        <Card className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: ROSA.destaque }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
            <CreditCard className="h-5 w-5" style={{ color: ROSA.destaque }} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold font-display" style={{ color: ROSA.textoDestaque }}>{fmt(computed.ticketThis)}</p>
              {computed.ticketVariation !== 0 && (
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${computed.ticketVariation > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {computed.ticketVariation > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(computed.ticketVariation)}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">aprovado este mês</p>
          </CardContent>
        </Card>

        {/* Aguardando resposta */}
        <Card className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: "hsl(35, 80%, 50%)" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando Resposta</CardTitle>
            <Send className="h-5 w-5" style={{ color: "hsl(35, 80%, 50%)" }} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold font-display" style={{ color: "hsl(35, 60%, 35%)" }}>{computed.proposalsAwaiting}</p>
              {computed.hasUrgentProposal && (
                <Badge variant="destructive" className="text-xs">+7d</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">propostas enviadas</p>
          </CardContent>
        </Card>
      </div>

      {/* ═══ BLOCO 2 — FINANCEIRO ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gráfico Receita 6 meses */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-display">Receita Escritório vs Mês</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {computed.receitaChartData.some((d) => d.receita > 0) ? (
              <ChartContainer config={receitaChartConfig} className="h-[260px] w-full">
                <BarChart data={computed.receitaChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={yAxisFormatter} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmt(Number(v))} />} />
                  <Bar dataKey="receita" fill={ROSA.fill1} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="h-12 w-12 text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Nenhum recebimento ainda</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
                  <Plus className="h-4 w-4 mr-1" /> Registrar pagamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos recebimentos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display">Próximos Recebimentos</CardTitle>
            <CardDescription>Pendentes nos próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {computed.upcomingPayments.length > 0 ? (
              <div className="space-y-3">
                {computed.upcomingPayments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{p.project}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(p.dueDate), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-sm font-semibold">{fmt(p.value)}</span>
                      <Badge variant={p.daysLeft <= 3 ? "destructive" : "outline"} className="text-xs">
                        {p.daysLeft}d
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-10 w-10 text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum recebimento pendente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ BLOCO 3 — ALERTAS E AÇÕES ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tarefas atrasadas */}
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
          style={{ borderLeftColor: overdueTasks > 0 ? "hsl(0, 70%, 50%)" : "hsl(152, 60%, 40%)" }}
          onClick={() => navigate("/projects")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tarefas Atrasadas</p>
                <p className="text-3xl font-bold font-display" style={{ color: overdueTasks > 0 ? "hsl(0, 70%, 50%)" : "hsl(152, 50%, 35%)" }}>{overdueTasks}</p>
              </div>
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: overdueTasks > 0 ? "hsl(0, 85%, 95%)" : "hsl(152, 40%, 95%)" }}>
                {overdueTasks > 0 ? <AlertTriangle className="h-6 w-6" style={{ color: "hsl(0, 70%, 50%)" }} /> : <CheckCircle2 className="h-6 w-6" style={{ color: "hsl(152, 60%, 40%)" }} />}
              </div>
            </div>
            {overdueTasks === 0 && <p className="text-xs text-muted-foreground mt-2">Tudo em dia 🎉</p>}
          </CardContent>
        </Card>

        {/* NFs pendentes */}
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
          style={{ borderLeftColor: pendingNFs > 0 ? ROSA.destaque : "hsl(152, 60%, 40%)" }}
          onClick={() => navigate("/admin/invoices")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">NFs Pendentes de Envio</p>
                <p className="text-3xl font-bold font-display" style={{ color: pendingNFs > 0 ? ROSA.textoDestaque : "hsl(152, 50%, 35%)" }}>{pendingNFs}</p>
              </div>
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: pendingNFs > 0 ? ROSA.fundoSuave : "hsl(152, 40%, 95%)" }}>
                <FileText className="h-6 w-6" style={{ color: pendingNFs > 0 ? ROSA.destaque : "hsl(152, 60%, 40%)" }} />
              </div>
            </div>
            {pendingNFs === 0 && <p className="text-xs text-muted-foreground mt-2">Todas enviadas ✓</p>}
          </CardContent>
        </Card>

        {/* Leads sem follow-up */}
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer border-l-4"
          style={{ borderLeftColor: staleLeads > 0 ? "hsl(35, 80%, 50%)" : "hsl(152, 60%, 40%)" }}
          onClick={() => navigate("/leads/pipeline")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Leads sem Follow-up +7d</p>
                <p className="text-3xl font-bold font-display" style={{ color: staleLeads > 0 ? "hsl(35, 60%, 35%)" : "hsl(152, 50%, 35%)" }}>{staleLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: staleLeads > 0 ? "hsl(35, 80%, 95%)" : "hsl(152, 40%, 95%)" }}>
                <Clock className="h-6 w-6" style={{ color: staleLeads > 0 ? "hsl(35, 80%, 50%)" : "hsl(152, 60%, 40%)" }} />
              </div>
            </div>
            {staleLeads === 0 && <p className="text-xs text-muted-foreground mt-2">Todos acompanhados ✓</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
