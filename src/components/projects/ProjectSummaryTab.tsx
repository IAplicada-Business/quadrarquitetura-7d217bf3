import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { statusLabels } from "@/lib/projectConstants";

const typeLabels: Record<string, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  saude: "Saúde",
  outro: "Outro",
};

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orçamento Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-display">{formatCurrency(project.estimated_budget as number)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orçamento Real</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-display">{formatCurrency(project.real_budget as number)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm">
              {statusLabels[project.status as string] || (project.status as string)}
            </Badge>
          </CardContent>
        </Card>
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
              <span className="text-muted-foreground">Tipo</span>
              <span className="font-medium">{typeLabels[project.project_type as string] || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Endereço</span>
              <span className="font-medium">{(project.address as string) || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Bairro</span>
              <span className="font-medium">{(project.neighborhood as string) || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Cidade</span>
              <span className="font-medium">{(project.city as string) || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Área</span>
              <span className="font-medium">{project.area_sqm ? `${project.area_sqm} m²` : "—"}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Data Início</span>
              <span className="font-medium">{formatDate(project.start_date as string)}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Previsão Término</span>
              <span className="font-medium">{formatDate(project.expected_end_date as string)}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Nível Acabamento</span>
              <span className="font-medium">{project.finish_level ? `${project.finish_level}/5` : "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
