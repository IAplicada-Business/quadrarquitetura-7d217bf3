import { LayoutDashboard, Ruler, CreditCard, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Projetos Ativos", value: "0", icon: Ruler, color: "text-primary" },
  { label: "Pagamentos Pendentes", value: "0", icon: CreditCard, color: "text-warning" },
  { label: "Próximas Etapas", value: "0", icon: CalendarDays, color: "text-success" },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-1">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Visão geral do escritório</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-display">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Projetos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <LayoutDashboard className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum projeto cadastrado ainda</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Pagamentos da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <CreditCard className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum pagamento pendente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
