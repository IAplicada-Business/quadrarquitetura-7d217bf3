import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  cotado: { label: "Cotado", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
};

interface BudgetQuoteCardProps {
  quote: Record<string, unknown>;
  onEdit: () => void;
  onDelete: () => void;
  onApprove: () => void;
}

export function BudgetQuoteCard({ quote, onEdit, onDelete, onApprove }: BudgetQuoteCardProps) {
  const isApproved = quote.status === "aprovado";
  const supplierDisplay = (quote.suppliers as { name: string } | null)?.name || (quote.supplier_name as string) || "Fornecedor não informado";
  const statusInfo = statusConfig[(quote.status as string) || "pendente"];

  return (
    <Card className={cn(
      "transition-all",
      isApproved && "ring-2 ring-success bg-success/5"
    )}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-sm">{supplierDisplay}</p>
            {isApproved && (
              <div className="flex items-center gap-1 text-xs text-success mt-0.5">
                <CheckCircle className="h-3 w-3" /> Aprovado
              </div>
            )}
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>

        {quote.services_description && (
          <p className="text-xs text-muted-foreground">{quote.services_description as string}</p>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Serviço</span>
            <p className="font-semibold">{formatCurrency(quote.value as number)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Material</span>
            <p className="font-semibold">{formatCurrency(quote.material_estimate as number)}</p>
          </div>
          {quote.delivery_time && (
            <div>
              <span className="text-muted-foreground text-xs">Prazo</span>
              <p>{quote.delivery_time as string}</p>
            </div>
          )}
          {quote.payment_terms && (
            <div>
              <span className="text-muted-foreground text-xs">Pagamento</span>
              <p>{quote.payment_terms as string}</p>
            </div>
          )}
        </div>

        <div className="flex gap-1 pt-1 border-t border-border">
          {!isApproved && (
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={onApprove}>
              <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" /> Editar
          </Button>
          <Button size="sm" variant="ghost" className="text-xs h-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3 mr-1" /> Remover
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
