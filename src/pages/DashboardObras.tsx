import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  HardHat,
  AlertCircle,
  ShoppingCart,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  DollarSign,
  CreditCard,
  TrendingUp,
  MapPin,
  Users,
  BarChart3,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfWeek, endOfWeek, isAfter, parseISO, getDay, differenceInDays, getISOWeek, eachWeekOfInterval, min as dateMin, max as dateMax, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ── paleta azul obras ──────────────────────────── */
const AZUL = {
  destaque: "hsl(209, 59%, 30%)",
  fundoSuave: "hsl(209, 30%, 96%)",
  textoDestaque: "hsl(209, 50%, 25%)",
  fill1: "hsl(209, 59%, 30%)",
  fill2: "hsl(209, 45%, 50%)",
  fill3: "hsl(195, 55%, 55%)",
  fill4: "hsl(209, 30%, 70%)",
};

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

const finStatusConfig: Record<string, { label: string; color: string }> = {
  em_dia: { label: "Em dia", color: "hsl(152, 60%, 40%)" },
  alerta: { label: "Alerta", color: "hsl(38, 92%, 50%)" },
  atrasado: { label: "Atrasado", color: "hsl(0, 70%, 50%)" },
};

const materialStatusLabel: Record<string, string> = {
  necessario: "A comprar",
  comprado: "Comprado",
  entregue: "Entregue",
};

const materialStatusIcon: Record<string, typeof Package> = {
  necessario: ShoppingCart,
  comprado: Package,
  entregue: Truck,
};

const materialStatusColor: Record<string, string> = {
  necessario: "hsl(38, 92%, 50%)",
  comprado: AZUL.fill2,
  entregue: AZUL.fill3,
};

const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/* ── componente ────────────────────────────────── */
export default function DashboardObras() {
  const { user } = useAuth();
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  // ── Queries ──
  const { data: projects = [] } = useQuery({
    queryKey: ["dash-obras-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name, status, estimated_budget").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: pendingItems = [] } = useQuery({
    queryKey: ["dash-obras-pending"],
    queryFn: async () => {
      const { data } = await supabase.from("pending_items").select("id, description, status, project_id, projects(name)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["dash-obras-materials"],
    queryFn: async () => {
      const { data } = await supabase.from("material_tracking").select("id, material_name, quantity_needed, quantity_purchased, quantity_delivered, unit, project_id, supplier_name, purchase_date, delivery_date, projects(name)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: scheduleTasks = [] } = useQuery({
    queryKey: ["dash-obras-schedule"],
    queryFn: async () => {
      const { data } = await supabase.from("schedule_tasks").select("id, task_name, start_date, end_date, status, discipline, project_id, supplier_name, projects(name)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["dash-obras-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("id, value, due_date, status, supplier_name, description, project_id, projects(name)").eq("user_id", user!.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  // ── Computed Operacional ──
  const op = useMemo(() => {
    const execucao = projects.filter((p) => p.status === "execucao");
    const pendenciasAbertas = pendingItems.filter((p) => p.status !== "concluido");
    const comprasPendentes = materials.filter((m) => (m.quantity_purchased ?? 0) === 0 && (m.quantity_needed ?? 0) > 0);
    const etapasSemana = scheduleTasks.filter((t) => t.start_date && t.start_date >= weekStart && t.start_date <= weekEnd);

    // Progresso por projeto
    const projectMap = new Map<string, { name: string; total: number; done: number; pendencias: number; nextStep: string }>();
    execucao.forEach((p) => projectMap.set(p.id, { name: p.name, total: 0, done: 0, pendencias: 0, nextStep: "" }));
    scheduleTasks.forEach((t) => {
      const entry = projectMap.get(t.project_id);
      if (!entry) return;
      entry.total++;
      if (t.status === "executado" || t.status === "concluido") entry.done++;
      if (!entry.nextStep && t.start_date && t.start_date >= todayStr && t.status !== "executado" && t.status !== "concluido") {
        entry.nextStep = t.task_name;
      }
    });
    pendingItems.forEach((p) => {
      const entry = projectMap.get(p.project_id);
      if (entry && p.status !== "concluido") entry.pendencias++;
    });
    const projectProgress = Array.from(projectMap.values()).map((p) => ({
      ...p,
      progress: p.total > 0 ? Math.round((p.done / p.total) * 100) : 0,
    }));

    // Cronograma semanal agrupado por dia
    const weekDays: { day: string; date: string; items: { project: string; task: string }[] }[] = [];
    for (let d = 1; d <= 5; d++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + d - 1);
      const dateStr = format(dayDate, "yyyy-MM-dd");
      const displayDate = format(dayDate, "dd/MM");
      const items = scheduleTasks
        .filter((t) => t.start_date && t.start_date <= dateStr && (t.end_date ? t.end_date >= dateStr : t.start_date === dateStr))
        .map((t) => ({ project: (t as any).projects?.name ?? "", task: t.task_name }));
      weekDays.push({ day: dayNames[dayDate.getDay()], date: displayDate, items });
    }

    // Pendências por obra
    const pendenciasPorObra: { project: string; items: { desc: string; status: string }[] }[] = [];
    const pendMap = new Map<string, { project: string; items: { desc: string; status: string }[] }>();
    pendenciasAbertas.forEach((p) => {
      const projName = (p as any).projects?.name ?? "Projeto";
      if (!pendMap.has(p.project_id)) pendMap.set(p.project_id, { project: projName, items: [] });
      pendMap.get(p.project_id)!.items.push({ desc: p.description, status: p.status ?? "pendente" });
    });
    pendMap.forEach((v) => pendenciasPorObra.push(v));

    // Compras & Materiais
    const comprasDisplay = materials.slice(0, 5).map((m) => {
      let status = "necessario";
      if ((m.quantity_delivered ?? 0) > 0) status = "entregue";
      else if ((m.quantity_purchased ?? 0) > 0) status = "comprado";
      return {
        item: m.material_name,
        project: (m as any).projects?.name ?? "",
        qtd: `${m.quantity_needed ?? 0} ${m.unit ?? ""}`.trim(),
        status,
      };
    });

    // Próximas etapas
    const proximasEtapas = scheduleTasks
      .filter((t) => t.start_date && t.start_date >= todayStr && t.status !== "executado" && t.status !== "concluido")
      .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""))
      .slice(0, 5)
      .map((t) => ({
        project: (t as any).projects?.name ?? "",
        task: t.task_name,
        start: t.start_date ? format(parseISO(t.start_date), "dd/MM") : "",
        discipline: t.discipline ?? "",
      }));

    return {
      obrasExecucao: execucao.length,
      pendenciasAbertas: pendenciasAbertas.length,
      comprasPendentes: comprasPendentes.length,
      etapasSemana: etapasSemana.length,
      projectProgress,
      weekDays,
      pendenciasPorObra,
      comprasDisplay,
      proximasEtapas,
    };
  }, [projects, pendingItems, materials, scheduleTasks, weekStart, weekEnd, todayStr]);

  // ── Computed Financeiro ──
  const fin = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status !== "concluido");
    const totalOrcado = activeProjects.reduce((s, p) => s + (p.estimated_budget ?? 0), 0);
    const totalPago = payments.filter((p) => p.status === "pago").reduce((s, p) => s + p.value, 0);

    const financeiroObras = activeProjects.map((proj) => {
      const projPayments = payments.filter((p) => p.project_id === proj.id);
      const pago = projPayments.filter((p) => p.status === "pago").reduce((s, p) => s + p.value, 0);
      const pendentes = projPayments.filter((p) => p.status === "pendente" && p.due_date && p.due_date < todayStr);
      const status = pendentes.length > 0 ? "alerta" : "em_dia";
      return { name: proj.name, orcamento: proj.estimated_budget ?? 0, pago, status };
    });

    const pagamentosProximos = payments
      .filter((p) => p.status === "pendente" || p.status === "atrasado")
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
      .slice(0, 5)
      .map((p) => ({
        supplier: p.supplier_name ?? p.description ?? "Pagamento",
        project: (p as any).projects?.name ?? "",
        value: p.value,
        dueDate: p.due_date ? format(parseISO(p.due_date), "dd/MM") : "",
        status: (p.due_date && p.due_date < todayStr ? "atrasado" : "pendente") as "atrasado" | "pendente",
      }));

    return { totalOrcado, totalPago, financeiroObras, pagamentosProximos };
  }, [projects, payments, todayStr]);

  const stats = [
    { label: "Obras em Execução", value: String(op.obrasExecucao), icon: HardHat, description: "em andamento" },
    { label: "Pendências Abertas", value: String(op.pendenciasAbertas), icon: AlertCircle, description: "a resolver" },
    { label: "Compras Pendentes", value: String(op.comprasPendentes), icon: ShoppingCart, description: "aguardando compra" },
    { label: "Etapas da Semana", value: String(op.etapasSemana), icon: CalendarCheck, description: "previstas p/ iniciar" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display mb-1">Obras</h1>
        <p className="text-muted-foreground">Visão operacional de campo</p>
      </div>

      <Tabs defaultValue="operacional" className="w-full">
        <TabsList>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro das Obras</TabsTrigger>
        </TabsList>

        {/* ═══ ABA OPERACIONAL ═══ */}
        <TabsContent value="operacional" className="space-y-6 mt-4">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <Card key={s.label} className="hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: AZUL.destaque }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <s.icon className="h-5 w-5" style={{ color: AZUL.destaque }} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-display" style={{ color: AZUL.textoDestaque }}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Progresso dos Projetos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Progresso dos Projetos</CardTitle>
              <CardDescription>Execução em andamento</CardDescription>
            </CardHeader>
            <CardContent>
              {op.projectProgress.length > 0 ? (
                <div className="space-y-5">
                  {op.projectProgress.map((p) => (
                    <div key={p.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.nextStep ? `Próx: ${p.nextStep}` : ""}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          {p.pendencias > 0 && (
                            <Badge variant="outline" className="text-xs" style={{ borderColor: "hsl(38,80%,50%)", color: "hsl(38,80%,40%)" }}>
                              {p.pendencias} pendências
                            </Badge>
                          )}
                          <span className="text-sm font-semibold" style={{ color: AZUL.destaque }}>{p.progress}%</span>
                        </div>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: AZUL.fundoSuave }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, backgroundColor: AZUL.destaque }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma obra em execução</p>
              )}
            </CardContent>
          </Card>

          {/* Cronograma Semanal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Cronograma Semanal</CardTitle>
              <CardDescription>Quem está onde esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {op.weekDays.map((day) => (
                  <div key={day.day}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold" style={{ color: AZUL.textoDestaque }}>{day.day}</span>
                      <span className="text-xs text-muted-foreground">{day.date}</span>
                    </div>
                    <div className="space-y-1 pl-4 border-l-2" style={{ borderColor: AZUL.fill4 }}>
                      {day.items.length > 0 ? day.items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-md text-sm">
                          <HardHat className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{it.task}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{it.project}</span>
                        </div>
                      )) : (
                        <p className="text-xs text-muted-foreground p-2">Nenhuma atividade</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grid — Pendências + Compras */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Pendências por Obra</CardTitle>
                <CardDescription>Itens a resolver</CardDescription>
              </CardHeader>
              <CardContent>
                {op.pendenciasPorObra.length > 0 ? (
                  <div className="space-y-4">
                    {op.pendenciasPorObra.map((obra) => (
                      <div key={obra.project}>
                        <p className="text-sm font-semibold mb-2" style={{ color: AZUL.textoDestaque }}>{obra.project}</p>
                        <div className="space-y-1 pl-3 border-l-2" style={{ borderColor: AZUL.fill4 }}>
                          {obra.items.map((it, i) => (
                            <div key={i} className="flex items-center gap-2 py-1">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: it.status === "pendente" ? "hsl(38,92%,50%)" : AZUL.fill3 }} />
                              <span className="text-sm">{it.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma pendência aberta</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-display">Compras & Materiais</CardTitle>
                <CardDescription>Status de aquisição</CardDescription>
              </CardHeader>
              <CardContent>
                {op.comprasDisplay.length > 0 ? (
                  <div className="space-y-3">
                    {op.comprasDisplay.map((c, i) => {
                      const Icon = materialStatusIcon[c.status] ?? ShoppingCart;
                      const color = materialStatusColor[c.status] ?? AZUL.fill2;
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: AZUL.fundoSuave }}>
                              <Icon className="h-4 w-4" style={{ color }} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{c.item}</p>
                              <p className="text-xs text-muted-foreground">{c.project}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{c.qtd}</p>
                            <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>
                              {materialStatusLabel[c.status] ?? c.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum material registrado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Próximas Etapas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Próximas Etapas</CardTitle>
              <CardDescription>Tarefas que iniciam nos próximos dias</CardDescription>
            </CardHeader>
            <CardContent>
              {op.proximasEtapas.length > 0 ? (
                <div className="space-y-3">
                  {op.proximasEtapas.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: AZUL.fundoSuave }}>
                          <Clock className="h-5 w-5" style={{ color: AZUL.destaque }} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{e.task}</p>
                          <p className="text-xs text-muted-foreground">{e.project}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {e.discipline && <Badge variant="outline" className="text-xs mb-1">{e.discipline}</Badge>}
                        <p className="text-xs text-muted-foreground">Início {e.start}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma etapa futura registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ABA FINANCEIRO DAS OBRAS ═══ */}
        <TabsContent value="financeiro" className="space-y-6 mt-4">
          {/* Cards resumo financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4" style={{ borderLeftColor: AZUL.destaque }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orçado</p>
                    <p className="text-2xl font-bold font-display" style={{ color: AZUL.textoDestaque }}>{fmt(fin.totalOrcado)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8" style={{ color: AZUL.fill4 }} />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4" style={{ borderLeftColor: "hsl(152, 60%, 40%)" }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pago</p>
                    <p className="text-2xl font-bold font-display" style={{ color: "hsl(152, 50%, 30%)" }}>{fmt(fin.totalPago)}</p>
                  </div>
                  <DollarSign className="h-8 w-8" style={{ color: "hsl(152, 60%, 60%)" }} />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4" style={{ borderLeftColor: "hsl(38, 92%, 50%)" }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Pendente</p>
                    <p className="text-2xl font-bold font-display" style={{ color: "hsl(38, 80%, 35%)" }}>{fmt(fin.totalOrcado - fin.totalPago)}</p>
                  </div>
                  <CreditCard className="h-8 w-8" style={{ color: "hsl(38, 80%, 60%)" }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela por projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Financeiro por Projeto</CardTitle>
              <CardDescription>Execução financeira das obras ativas</CardDescription>
            </CardHeader>
            <CardContent>
              {fin.financeiroObras.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projeto</TableHead>
                      <TableHead className="text-right">Orçamento</TableHead>
                      <TableHead className="text-right">Pago</TableHead>
                      <TableHead className="text-center">% Executado</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fin.financeiroObras.map((p) => {
                      const pct = p.orcamento > 0 ? Math.round((p.pago / p.orcamento) * 100) : 0;
                      const cfg = finStatusConfig[p.status] ?? finStatusConfig.em_dia;
                      return (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{fmt(p.orcamento)}</TableCell>
                          <TableCell className="text-right">{fmt(p.pago)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: AZUL.fundoSuave }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: AZUL.destaque }} />
                              </div>
                              <span className="text-xs font-medium w-8 text-right">{pct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-xs" style={{ borderColor: cfg.color, color: cfg.color }}>
                              {cfg.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto ativo</p>
              )}
            </CardContent>
          </Card>

          {/* Próximos pagamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Próximos Pagamentos</CardTitle>
              <CardDescription>Vencimentos por fornecedor</CardDescription>
            </CardHeader>
            <CardContent>
              {fin.pagamentosProximos.length > 0 ? (
                <div className="space-y-3">
                  {fin.pagamentosProximos.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: p.status === "atrasado" ? "hsl(0,85%,95%)" : AZUL.fundoSuave }}
                        >
                          {p.status === "atrasado" ? (
                            <Clock className="h-4 w-4" style={{ color: "hsl(0,70%,50%)" }} />
                          ) : (
                            <CreditCard className="h-4 w-4" style={{ color: AZUL.destaque }} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.supplier}</p>
                          <p className="text-xs text-muted-foreground">{p.project}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{fmt(p.value)}</p>
                        <p className={`text-xs ${p.status === "atrasado" ? "font-medium" : "text-muted-foreground"}`} style={{ color: p.status === "atrasado" ? "hsl(0,70%,50%)" : undefined }}>
                          {p.status === "atrasado" ? "Atrasado" : p.dueDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum pagamento pendente</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
