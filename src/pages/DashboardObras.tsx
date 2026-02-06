import {
  HardHat,
  AlertCircle,
  ShoppingCart,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

/* ── mock data ─────────────────────────────────── */
const stats = [
  { label: "Obras em Execução", value: "3", icon: HardHat, trend: "+1", trendUp: true, description: "vs. mês anterior" },
  { label: "Pendências Abertas", value: "14", icon: AlertCircle, trend: "5", trendUp: false, description: "urgentes" },
  { label: "Compras Pendentes", value: "8", icon: ShoppingCart, trend: "3", trendUp: false, description: "aguardando compra" },
  { label: "Etapas da Semana", value: "6", icon: CalendarCheck, trend: "2", trendUp: true, description: "previstas p/ iniciar" },
];

const projectProgress = [
  { name: "Reforma Apto 142", client: "João Silva", progress: 75, nextStep: "Pintura paredes", pendencias: 3 },
  { name: "Casa Jardins", client: "Maria Santos", progress: 45, nextStep: "Instalação elétrica", pendencias: 5 },
  { name: "Clínica Saúde+", client: "Dr. Carlos", progress: 30, nextStep: "Gesso forro", pendencias: 6 },
];

const weekSchedule = [
  { day: "Segunda", date: "03/02", items: [
    { project: "Reforma Apto 142", task: "Abertura semanal", type: "ritual" },
    { project: "Casa Jardins", task: "Eletricista — fiação 1º andar", type: "work" },
  ]},
  { day: "Terça", date: "04/02", items: [
    { project: "Clínica Saúde+", task: "Gesseiro — forro sala", type: "work" },
    { project: "Reforma Apto 142", task: "Porcelanato — assentamento cozinha", type: "work" },
  ]},
  { day: "Quarta", date: "05/02", items: [
    { project: "Casa Jardins", task: "Visita técnica hidráulica", type: "visit" },
    { project: "Reforma Apto 142", task: "Pintor — quarto 2", type: "work" },
  ]},
  { day: "Quinta", date: "06/02", items: [
    { project: "Clínica Saúde+", task: "Marceneiro — medição", type: "work" },
  ]},
  { day: "Sexta", date: "07/02", items: [
    { project: "Reforma Apto 142", task: "Fechamento semanal", type: "ritual" },
    { project: "Casa Jardins", task: "Fechamento semanal", type: "ritual" },
  ]},
];

const pendenciasPorObra = [
  {
    project: "Reforma Apto 142",
    items: [
      { desc: "Confirmar cor do rejunte com cliente", status: "pendente" },
      { desc: "Solicitar tomada 20A para cooktop", status: "pendente" },
      { desc: "Verificar nível contrapiso varanda", status: "em_andamento" },
    ],
  },
  {
    project: "Casa Jardins",
    items: [
      { desc: "Laudo estrutural da laje", status: "pendente" },
      { desc: "Definir posição shaft banheiro", status: "pendente" },
      { desc: "Orçamento esquadrias alumínio", status: "pendente" },
      { desc: "Aprovação planta elétrica cliente", status: "em_andamento" },
      { desc: "Cotação tinta Coral/Suvinil", status: "em_andamento" },
    ],
  },
  {
    project: "Clínica Saúde+",
    items: [
      { desc: "Aprovar layout iluminação recepção", status: "pendente" },
      { desc: "Entregar planta hidráulica p/ encanador", status: "pendente" },
    ],
  },
];

const comprasPendentes = [
  { item: "Porcelanato Portobello 60×120", project: "Reforma Apto 142", qtd: "32 m²", status: "a_comprar" },
  { item: "Cabo 2,5mm preto (rolo 100m)", project: "Casa Jardins", qtd: "3 rolos", status: "a_comprar" },
  { item: "Disjuntor 20A bipolar", project: "Casa Jardins", qtd: "4 un", status: "comprado" },
  { item: "Forro PVC 200mm", project: "Clínica Saúde+", qtd: "28 m²", status: "a_comprar" },
  { item: "Tinta acrílica branca 18L", project: "Reforma Apto 142", qtd: "2 latas", status: "entregue" },
];

const proximasEtapas = [
  { project: "Reforma Apto 142", task: "Pintura quartos", start: "10/02", discipline: "Pintura" },
  { project: "Casa Jardins", task: "Fiação 2º andar", start: "10/02", discipline: "Elétrica" },
  { project: "Clínica Saúde+", task: "Gesso forro consultórios", start: "11/02", discipline: "Gesso" },
  { project: "Reforma Apto 142", task: "Assentamento piso sala", start: "12/02", discipline: "Revestimento" },
];

const statusIcon: Record<string, typeof Package> = {
  a_comprar: ShoppingCart,
  comprado: Package,
  entregue: Truck,
  instalado: CheckCircle2,
};

const statusColor: Record<string, string> = {
  a_comprar: "hsl(38, 92%, 50%)",
  comprado: AZUL.fill2,
  entregue: AZUL.fill3,
  instalado: "hsl(152, 60%, 40%)",
};

const typeStyles: Record<string, { bg: string; text: string }> = {
  ritual: { bg: AZUL.fundoSuave, text: AZUL.destaque },
  visit: { bg: "hsl(38,90%,95%)", text: "hsl(38,80%,35%)" },
  work: { bg: "transparent", text: "inherit" },
};

/* ── componente ────────────────────────────────── */
export default function DashboardObras() {
  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold font-display mb-1">Obras</h1>
        <p className="text-muted-foreground">Visão operacional de campo</p>
      </div>

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
              <div className="flex items-center gap-1 mt-1">
                {s.trendUp ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-amber-500" />}
                <span className={`text-xs ${s.trendUp ? "text-emerald-500" : "text-amber-500"}`}>{s.trend}</span>
                <span className="text-xs text-muted-foreground">{s.description}</span>
              </div>
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
          <div className="space-y-5">
            {projectProgress.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.client} · Próx: {p.nextStep}</p>
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
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.progress}%`, backgroundColor: AZUL.destaque }}
                  />
                </div>
              </div>
            ))}
          </div>
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
            {weekSchedule.map((day) => (
              <div key={day.day}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold" style={{ color: AZUL.textoDestaque }}>{day.day}</span>
                  <span className="text-xs text-muted-foreground">{day.date}</span>
                </div>
                <div className="space-y-1 pl-4 border-l-2" style={{ borderColor: AZUL.fill4 }}>
                  {day.items.map((it, i) => {
                    const style = typeStyles[it.type];
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-md text-sm" style={{ backgroundColor: style.bg }}>
                        {it.type === "ritual" && <CalendarCheck className="h-4 w-4" style={{ color: style.text }} />}
                        {it.type === "visit" && <MapPin className="h-4 w-4" style={{ color: style.text }} />}
                        {it.type === "work" && <HardHat className="h-4 w-4 text-muted-foreground" />}
                        <span className="font-medium" style={{ color: it.type !== "work" ? style.text : undefined }}>{it.task}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{it.project}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid — Pendências + Compras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pendências por Obra */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Pendências por Obra</CardTitle>
            <CardDescription>Itens a resolver</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendenciasPorObra.map((obra) => (
                <div key={obra.project}>
                  <p className="text-sm font-semibold mb-2" style={{ color: AZUL.textoDestaque }}>{obra.project}</p>
                  <div className="space-y-1 pl-3 border-l-2" style={{ borderColor: AZUL.fill4 }}>
                    {obra.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: it.status === "pendente" ? "hsl(38,92%,50%)" : AZUL.fill3,
                          }}
                        />
                        <span className="text-sm">{it.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compras Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Compras & Materiais</CardTitle>
            <CardDescription>Status de aquisição</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comprasPendentes.map((c, i) => {
                const Icon = statusIcon[c.status] ?? ShoppingCart;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: AZUL.fundoSuave }}>
                        <Icon className="h-4 w-4" style={{ color: statusColor[c.status] }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.item}</p>
                        <p className="text-xs text-muted-foreground">{c.project}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{c.qtd}</p>
                      <Badge variant="outline" className="text-xs" style={{ borderColor: statusColor[c.status], color: statusColor[c.status] }}>
                        {c.status === "a_comprar" ? "A comprar" : c.status === "comprado" ? "Comprado" : "Entregue"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
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
          <div className="space-y-3">
            {proximasEtapas.map((e, i) => (
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
                  <Badge variant="outline" className="text-xs mb-1">{e.discipline}</Badge>
                  <p className="text-xs text-muted-foreground">Início {e.start}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
