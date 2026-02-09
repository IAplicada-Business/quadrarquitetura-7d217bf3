import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { statusLabels } from "@/lib/projectConstants";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Wallet, Hammer, FileText, BarChart3, Users, HardHat } from "lucide-react";

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

interface ProjectSummaryTabProps {
  project: Record<string, unknown>;
}

export function ProjectSummaryTab({ project }: ProjectSummaryTabProps) {
  const clientName = (project.clients as { name: string } | null)?.name;
  
  // Calculate indicators (mocked for now, but structure is ready)
  const idealBudget = (project.ideal_budget as number) || 0;
  const contractedBudget = (project.estimated_budget as number) || 0;
  const realBudget = (project.real_budget as number) || 0;
  const progress = (project.finish_level as number) || 0;

  // Safe percentage calculation
  const contractedPercent = idealBudget > 0 ? Math.min((contractedBudget / idealBudget) * 100, 100) : 0;
  const realPercent = contractedBudget > 0 ? Math.min((realBudget / contractedBudget) * 100, 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Orçamento Ideal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-display">{formatCurrency(idealBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Contratado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(contractedBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(realBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold">{progress}%</span>
              <Badge variant="outline">{statusLabels[project.status as string] || project.status}</Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Visual Bars Comparison */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold text-display">Comparativo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ideal vs Contracted vs Real */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Idealizado</span>
              <span className="font-medium">{formatCurrency(idealBudget)}</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-400" style={{ width: "100%" }} />
            </div>
            
            <div className="flex justify-between text-sm mt-2">
              <span>Contratado</span>
              <span className="font-medium">{formatCurrency(contractedBudget)}</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500" 
                style={{ width: `${contractedPercent}%` }} 
              />
            </div>

            <div className="flex justify-between text-sm mt-2">
              <span>Pago / Realizado</span>
              <span className="font-medium">{formatCurrency(realBudget)}</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${realPercent}%` }} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Wallet, label: "Financeiro", href: "financeiro" },
          { icon: Hammer, label: "Cronograma", href: "cronograma" },
          { icon: FileText, label: "Documentos", href: "documentos" },
          { icon: HardHat, label: "Diário de Obra", href: "/construction/tracking" },
        ].map((link, i) => (
          <Button 
            key={i} 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all"
            asChild
          >
            {link.href.startsWith("/") ? (
              <Link to={link.href}>
                <link.icon className="h-6 w-6 text-primary" />
                <span>{link.label}</span>
              </Link>
            ) : (
              <div className="cursor-pointer"> {/* This would just be visual if inside tabs */}
                <link.icon className="h-6 w-6 text-primary" />
                <span>{link.label}</span>
              </div>
            )}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-display">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-medium">{clientName || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Endereço</span>
              <span className="font-medium">{(project.address as string) || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Cidade</span>
              <span className="font-medium">{(project.city as string) || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Data Início</span>
              <span className="font-medium">{formatDate(project.start_date as string)}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Previsão Término</span>
              <span className="font-medium">{formatDate(project.expected_end_date as string)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
