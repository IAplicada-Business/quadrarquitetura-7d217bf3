import { 
  LayoutDashboard, 
  Ruler, 
  CreditCard, 
  CalendarDays, 
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig 
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
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

// Dados mockados para o dashboard
const stats = [
  { 
    label: "Projetos Ativos", 
    value: "5", 
    icon: Ruler, 
    color: "text-primary",
    trend: "+2",
    trendUp: true,
    description: "vs. mês anterior"
  },
  { 
    label: "Pagamentos Pendentes", 
    value: "R$ 45.800", 
    icon: CreditCard, 
    color: "text-amber-500",
    trend: "8",
    trendUp: false,
    description: "parcelas esta semana"
  },
  { 
    label: "Próximas Etapas", 
    value: "12", 
    icon: CalendarDays, 
    color: "text-emerald-500",
    trend: "3",
    trendUp: true,
    description: "iniciam esta semana"
  },
  { 
    label: "Clientes Ativos", 
    value: "8", 
    icon: Users, 
    color: "text-blue-500",
    trend: "+1",
    trendUp: true,
    description: "novo este mês"
  },
];

// Dados para gráfico de orçamentos por status
const budgetStatusData = [
  { name: "Aprovados", value: 185000, fill: "hsl(var(--primary))" },
  { name: "Pendentes", value: 72000, fill: "hsl(45, 93%, 47%)" },
  { name: "Em Cotação", value: 45000, fill: "hsl(200, 80%, 50%)" },
  { name: "Rejeitados", value: 12000, fill: "hsl(0, 70%, 50%)" },
];

const budgetChartConfig: ChartConfig = {
  Aprovados: { label: "Aprovados", color: "hsl(var(--primary))" },
  Pendentes: { label: "Pendentes", color: "hsl(45, 93%, 47%)" },
  "Em Cotação": { label: "Em Cotação", color: "hsl(200, 80%, 50%)" },
  Rejeitados: { label: "Rejeitados", color: "hsl(0, 70%, 50%)" },
};

// Dados para gráfico de pagamentos mensais
const paymentsMonthlyData = [
  { month: "Jan", recebido: 42000, pendente: 15000 },
  { month: "Fev", recebido: 38000, pendente: 22000 },
  { month: "Mar", recebido: 55000, pendente: 18000 },
  { month: "Abr", recebido: 48000, pendente: 25000 },
  { month: "Mai", recebido: 62000, pendente: 20000 },
  { month: "Jun", recebido: 58000, pendente: 28000 },
];

const paymentsChartConfig: ChartConfig = {
  recebido: { label: "Recebido", color: "hsl(var(--primary))" },
  pendente: { label: "Pendente", color: "hsl(45, 93%, 47%)" },
};

// Dados para gráfico de progresso por projeto
const projectProgressData = [
  { name: "Reforma Apto 142", progress: 75, total: 185000 },
  { name: "Casa Jardins", progress: 45, total: 320000 },
  { name: "Clínica Saúde+", progress: 30, total: 150000 },
  { name: "Escritório Tech", progress: 60, total: 95000 },
  { name: "Apartamento Centro", progress: 15, total: 120000 },
];

// Projetos recentes mockados
const recentProjects = [
  { 
    name: "Reforma Apto 142", 
    client: "João Silva", 
    status: "execucao_obra",
    progress: 75,
    value: 185000
  },
  { 
    name: "Casa Jardins", 
    client: "Maria Santos", 
    status: "orcamento",
    progress: 45,
    value: 320000
  },
  { 
    name: "Clínica Saúde+", 
    client: "Dr. Carlos", 
    status: "projeto_executivo",
    progress: 30,
    value: 150000
  },
];

// Pagamentos da semana mockados
const upcomingPayments = [
  { 
    supplier: "Eletricista Silva", 
    project: "Reforma Apto 142", 
    value: 4500, 
    dueDate: "07/02",
    status: "pendente"
  },
  { 
    supplier: "Marmoraria ABC", 
    project: "Casa Jardins", 
    value: 8200, 
    dueDate: "08/02",
    status: "pendente"
  },
  { 
    supplier: "Pintura & Cia", 
    project: "Reforma Apto 142", 
    value: 3800, 
    dueDate: "10/02",
    status: "pendente"
  },
  { 
    supplier: "Gesso Total", 
    project: "Clínica Saúde+", 
    value: 6500, 
    dueDate: "12/02",
    status: "atrasado"
  },
];

// Pendências urgentes
const urgentItems = [
  { type: "Pagamento", description: "Gesso Total - vencido há 3 dias", project: "Clínica Saúde+", severity: "high" },
  { type: "Material", description: "Porcelanato aguardando entrega", project: "Reforma Apto 142", severity: "medium" },
  { type: "Cronograma", description: "Pintura atrasada 2 dias", project: "Casa Jardins", severity: "medium" },
];

const statusLabels: Record<string, string> = {
  execucao_obra: "Em Execução",
  orcamento: "Orçamento",
  projeto_executivo: "Projeto Executivo",
  briefing: "Briefing",
};

const statusColors: Record<string, string> = {
  execucao_obra: "bg-emerald-500",
  orcamento: "bg-amber-500",
  projeto_executivo: "bg-blue-500",
  briefing: "bg-purple-500",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do escritório</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-display">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {stat.trendUp ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-amber-500" />
                )}
                <span className={`text-xs ${stat.trendUp ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {stat.trend}
                </span>
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas Urgentes */}
      {urgentItems.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urgentItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background/80">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${item.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
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

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pagamentos Mensais */}
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
                <YAxis 
                  tickFormatter={(value) => `${value/1000}k`} 
                  className="text-xs"
                />
                <ChartTooltip 
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
                />
                <Area 
                  type="monotone" 
                  dataKey="recebido" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="pendente" 
                  stackId="1"
                  stroke="hsl(45, 93%, 47%)" 
                  fill="hsl(45, 93%, 47%)" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Status dos Orçamentos */}
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
                  {budgetStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} 
                />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {budgetStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso dos Projetos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Progresso dos Projetos</CardTitle>
          <CardDescription>Acompanhamento de execução</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectProgressData.map((project) => (
              <div key={project.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(project.total)}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projetos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Projetos Recentes</CardTitle>
            <CardDescription>Últimas atualizações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${statusColors[project.status]} flex items-center justify-center`}>
                      <Ruler className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.client}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs mb-1">
                      {statusLabels[project.status]}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{formatCurrency(project.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pagamentos da Semana */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Pagamentos da Semana</CardTitle>
            <CardDescription>Próximos vencimentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.map((payment, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${payment.status === 'atrasado' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'}`}>
                      {payment.status === 'atrasado' ? (
                        <Clock className="h-4 w-4 text-red-500" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{payment.supplier}</p>
                      <p className="text-xs text-muted-foreground">{payment.project}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(payment.value)}</p>
                    <p className={`text-xs ${payment.status === 'atrasado' ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      {payment.status === 'atrasado' ? 'Atrasado' : payment.dueDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orçado</p>
                <p className="text-2xl font-bold font-display text-primary">R$ 870.000</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/40" />
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
