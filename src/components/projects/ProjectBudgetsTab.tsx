import { useState, useMemo } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useScopeItems } from "@/hooks/useScopeItems";
import { useBudgetQuotes } from "@/hooks/useBudgetQuotes";
import { BudgetQuoteCard } from "./BudgetQuoteCard";
import { BudgetQuoteForm } from "./BudgetQuoteForm";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface ProjectBudgetsTabProps {
  projectId: string;
}

export function ProjectBudgetsTab({ projectId }: ProjectBudgetsTabProps) {
  const { items: scopeItems } = useScopeItems(projectId);
  const { quotes, isLoading, create, update, remove, createRevision } = useBudgetQuotes(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Record<string, unknown> | null>(null);
  const [activeScopeId, setActiveScopeId] = useState<string | null>(null);

  // Get available revisions
  const revisions = useMemo(() => {
    const revNums = [...new Set(quotes.map((q) => q.revision_number))].sort((a, b) => (a ?? 0) - (b ?? 0));
    return revNums.length > 0 ? revNums : [1];
  }, [quotes]);

  const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
  const currentRev = selectedRevision ?? (revisions[revisions.length - 1] || 1);

  // Filter quotes by current revision
  const currentQuotes = useMemo(() => {
    return quotes.filter((q) => q.revision_number === currentRev);
  }, [quotes, currentRev]);

  // Group quotes by scope item
  const groupedQuotes = useMemo(() => {
    const groups: Record<string, typeof currentQuotes> = {};
    for (const q of currentQuotes) {
      const key = q.scope_item_id || "sem_disciplina";
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    }
    return groups;
  }, [currentQuotes]);

  // Calculate totals
  const totals = useMemo(() => {
    let total = 0;
    const byDiscipline: Record<string, number> = {};
    for (const [scopeId, qs] of Object.entries(groupedQuotes)) {
      const approved = qs.find((q) => q.status === "aprovado");
      const serviceValue = approved ? (approved.value || 0) : 0;
      const materialValue = approved ? (approved.material_estimate || 0) : 0;
      const subtotal = serviceValue + materialValue;
      byDiscipline[scopeId] = subtotal;
      total += subtotal;
    }
    return { total, byDiscipline };
  }, [groupedQuotes]);

  const handleAddQuote = (scopeItemId: string | null) => {
    setActiveScopeId(scopeItemId);
    setEditingQuote(null);
    setFormOpen(true);
  };

  const handleEditQuote = (quote: Record<string, unknown>) => {
    setActiveScopeId(quote.scope_item_id as string);
    setEditingQuote(quote);
    setFormOpen(true);
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editingQuote) {
      update.mutate({ id: editingQuote.id as string, ...data });
    } else {
      create.mutate(data as Parameters<typeof create.mutate>[0]);
    }
    setEditingQuote(null);
  };

  const handleApprove = (quoteId: string, scopeItemId: string | null) => {
    // Reject all others for same scope item in current revision, approve this one
    const siblings = currentQuotes.filter(
      (q) => q.scope_item_id === scopeItemId && q.id !== quoteId
    );
    for (const s of siblings) {
      if (s.status === "aprovado") {
        update.mutate({ id: s.id, status: "cotado" });
      }
    }
    update.mutate({ id: quoteId, status: "aprovado" });
  };

  const activeScopeName = scopeItems.find((s) => s.id === activeScopeId)?.discipline;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with revision selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-display">Orçamentos por Disciplina</h3>
          <p className="text-sm text-muted-foreground">Compare cotações e aprove fornecedores</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(currentRev)} onValueChange={(v) => setSelectedRevision(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {revisions.map((r) => (
                <SelectItem key={r} value={String(r)}>Rev {r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => createRevision.mutate(currentRev)} disabled={createRevision.isPending}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Nova Revisão
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : scopeItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Cadastre disciplinas na aba "Escopo" para começar a adicionar cotações.
        </div>
      ) : (
        <>
          {scopeItems.filter((s) => !s.parent_id).map((scope) => {
            const scopeQuotes = groupedQuotes[scope.id] || [];
            const subtotal = totals.byDiscipline[scope.id] || 0;

            return (
              <Card key={scope.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-display">{scope.discipline}</CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">{formatCurrency(subtotal)}</span>
                      <Button size="sm" variant="outline" onClick={() => handleAddQuote(scope.id)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Cotação
                      </Button>
                    </div>
                  </div>
                  {scope.description && (
                    <p className="text-xs text-muted-foreground mt-1">{scope.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {scopeQuotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma cotação cadastrada</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {scopeQuotes.map((q) => (
                        <BudgetQuoteCard
                          key={q.id}
                          quote={q as Record<string, unknown>}
                          onEdit={() => handleEditQuote(q as Record<string, unknown>)}
                          onDelete={() => remove.mutate(q.id)}
                          onApprove={() => handleApprove(q.id, q.scope_item_id)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Total geral */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-display">Total Geral do Orçamento</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totals.total)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Soma dos fornecedores aprovados + estimativa de material por disciplina
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <BudgetQuoteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingQuote}
        scopeItemId={activeScopeId || undefined}
        scopeItemName={activeScopeName}
        revisionNumber={currentRev}
        isLoading={create.isPending || update.isPending}
      />
    </div>
  );
}
