import { useState, useMemo } from "react";
import { Plus, RefreshCw, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useScopeItems } from "@/hooks/useScopeItems";
import { useBudgetQuotes } from "@/hooks/useBudgetQuotes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { BudgetQuoteCard } from "./BudgetQuoteCard";
import { BudgetQuoteForm } from "./BudgetQuoteForm";
import { ProjectPurchasesTab } from "./ProjectPurchasesTab";
import { ShoppingListDialog } from "./ShoppingListDialog";
import { ShoppingCart, Calculator } from "lucide-react";
import { useProjectActivities } from "@/hooks/useProjectActivities";
import { BudgetPreviewDialog } from "./BudgetPreviewDialog";
import { useMaterialIndices } from "@/hooks/useMaterialIndices";
import { usePriceResearch } from "@/hooks/usePriceResearch";
import { PriceSearchDialog } from "./PriceSearchDialog";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function parsePaymentTerms(terms: string | null, totalValue: number): { percent: number; value: number }[] {
  if (!terms) return [{ percent: 100, value: totalValue }];
  const cleaned = terms.toLowerCase().trim();
  if (cleaned === "a vista" || cleaned === "à vista") return [{ percent: 100, value: totalValue }];

  // Try parsing "50%/50%" or "50/50" or "30/30/40"
  const parts = cleaned.replace(/%/g, "").split(/[\/,;]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  if (parts.length === 0) return [{ percent: 100, value: totalValue }];

  const sum = parts.reduce((a, b) => a + b, 0);
  return parts.map(p => {
    const pct = sum > 0 ? p / sum * 100 : 100 / parts.length;
    return { percent: Math.round(pct), value: Math.round(totalValue * pct / 100) };
  });
}

interface ProjectBudgetsTabProps {
  projectId: string;
  projectName?: string;
}

export function ProjectBudgetsTab({ projectId, projectName = "" }: ProjectBudgetsTabProps) {
  const { items: scopeItems } = useScopeItems(projectId);
  const { quotes, isLoading, create, update, remove, createRevision } = useBudgetQuotes(projectId);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activities } = useProjectActivities(projectId);
  const { indices } = useMaterialIndices();
  const { research, getRecentForActivity } = usePriceResearch(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Record<string, unknown> | null>(null);
  const [activeScopeId, setActiveScopeId] = useState<string | null>(null);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [budgetPreviewOpen, setBudgetPreviewOpen] = useState(false);
  const [priceSearchOpen, setPriceSearchOpen] = useState(false);
  const [priceSearchActivity, setPriceSearchActivity] = useState<{
    id: string; name: string; materials: { name: string; unit: string; quantity: number }[];
  } | null>(null);
  const [priceSearchExisting, setPriceSearchExisting] = useState<any[] | undefined>(undefined);

  const revisions = useMemo(() => {
    const revNums = [...new Set(quotes.map((q) => q.revision_number))].sort((a, b) => (a ?? 0) - (b ?? 0));
    return revNums.length > 0 ? revNums : [1];
  }, [quotes]);

  const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
  const currentRev = selectedRevision ?? (revisions[revisions.length - 1] || 1);

  const currentQuotes = useMemo(() => {
    return quotes.filter((q) => q.revision_number === currentRev);
  }, [quotes, currentRev]);

  const groupedQuotes = useMemo(() => {
    const groups: Record<string, typeof currentQuotes> = {};
    for (const q of currentQuotes) {
      const key = q.scope_item_id || "sem_disciplina";
      if (!groups[key]) groups[key] = [];
      groups[key].push(q);
    }
    return groups;
  }, [currentQuotes]);

  const contractedScopeItems = scopeItems.filter(s => s.scope_type === 'contratado');

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

  const handleApprove = async (quoteId: string, scopeItemId: string | null) => {
    // Reject all others for same scope item in current revision
    const siblings = currentQuotes.filter(
      (q) => q.scope_item_id === scopeItemId && q.id !== quoteId
    );
    for (const s of siblings) {
      if (s.status === "aprovado") {
        update.mutate({ id: s.id, status: "cotado" });
      }
    }
    update.mutate({ id: quoteId, status: "aprovado" });

    // Generate payment installments automatically
    const quote = currentQuotes.find(q => q.id === quoteId);
    if (quote && user) {
      const totalValue = (quote.value || 0) + (quote.material_estimate || 0);
      if (totalValue > 0) {
        const installments = parsePaymentTerms(quote.payment_terms, totalValue);
        const today = new Date();
        const paymentInserts = installments.map((inst, idx) => {
          const dueDate = new Date(today);
          dueDate.setDate(dueDate.getDate() + (idx * 30));
          return {
            user_id: user.id,
            project_id: projectId,
            value: inst.value,
            description: `${scopeItems.find(s => s.id === scopeItemId)?.discipline || "Serviço"} - Parcela ${idx + 1}/${installments.length}`,
            supplier_name: quote.supplier_name,
            budget_quote_id: quoteId,
            due_date: dueDate.toISOString().split("T")[0],
            installment_number: idx + 1,
            total_installments: installments.length,
            status: "pendente" as const,
          };
        });

        const { error } = await supabase.from("payments").insert(paymentInserts);
        if (error) {
          toast({ title: "Aviso", description: "Cotação aprovada, mas erro ao gerar parcelas: " + error.message, variant: "destructive" });
        } else {
          queryClient.invalidateQueries({ queryKey: ["project_payments", projectId] });
          toast({ title: `${installments.length} parcela(s) gerada(s) automaticamente` });
        }
      }
    }
  };

  const activeScopeName = scopeItems.find((s) => s.id === activeScopeId)?.discipline;

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="cotacoes">
        <TabsList>
          <TabsTrigger value="cotacoes">Cotações por Disciplina</TabsTrigger>
          <TabsTrigger value="compras">Lista de Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="cotacoes" className="space-y-6 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-display">Orçamentos (Escopo Contratado)</h3>
              <p className="text-sm text-muted-foreground">Compare cotações e aprove fornecedores para cada disciplina</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(currentRev)} onValueChange={(v) => setSelectedRevision(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {revisions.map((r) => (
                    <SelectItem key={r} value={String(r)}>Rev {r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => createRevision.mutate(currentRev)} disabled={createRevision.isPending}>
                <RefreshCw className="h-4 w-4 mr-1" /> Nova Revisão
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShoppingListOpen(true)}>
                <ShoppingCart className="h-4 w-4 mr-1" /> Lista de Compras
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : contractedScopeItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Cadastre disciplinas contratadas na aba "Escopo" para começar a adicionar cotações.
            </div>
          ) : (
            <>
              {contractedScopeItems.filter((s) => !s.parent_id).map((scope) => {
                const scopeQuotes = groupedQuotes[scope.id] || [];
                const subtotal = totals.byDiscipline[scope.id] || 0;
                const approvedQuote = scopeQuotes.find(q => q.status === 'aprovado');

                return (
                  <Card key={scope.id} className={approvedQuote ? "border-green-500/50 bg-green-50/10" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base text-display">{scope.discipline}</CardTitle>
                          {approvedQuote && <Badge variant="default" className="bg-green-600 text-[10px]">Fornecedor Definido</Badge>}
                        </div>
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
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                          Nenhuma cotação. Clique em "Cotação" para adicionar.
                        </div>
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

              <Card className="bg-primary/5 border-primary/20 sticky bottom-4 shadow-lg">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-semibold text-display">Total Geral Aprovado</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Soma dos fornecedores aprovados + estimativa de material por disciplina
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(totals.total)}</span>
                  </div>
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

          <ShoppingListDialog
            open={shoppingListOpen}
            onOpenChange={setShoppingListOpen}
            projectId={projectId}
            projectName={projectName}
          />

          {/* Pesquisa de Preços por Atividade */}
          {activities.filter((a) => a.area_m2 && a.area_m2 > 0).length > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-display">Pesquisa de Preços por Atividade</CardTitle>
                <p className="text-xs text-muted-foreground">Pesquise preços de materiais em BH com base nas atividades cadastradas</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activities.filter((a) => a.area_m2 && a.area_m2 > 0).map((activity) => {
                    const matchingIndices = indices.filter(
                      (idx) => activity.name.toLowerCase().includes(idx.activity_type.toLowerCase())
                    );
                    const materialsForActivity = matchingIndices.map((idx) => ({
                      name: idx.material_name,
                      unit: idx.unit,
                      quantity: Math.ceil(idx.index_per_m2 * (activity.area_m2 || 0)),
                    }));
                    const recentResearch = getRecentForActivity(activity.id);
                    const hasRecent = recentResearch.length > 0;

                    if (materialsForActivity.length === 0) return null;

                    return (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{activity.name}</p>
                          <p className="text-xs text-muted-foreground">{activity.area_m2} m² • {materialsForActivity.length} material(is)</p>
                        </div>
                        <div className="flex gap-1">
                          {hasRecent && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPriceSearchActivity({ id: activity.id, name: activity.name, materials: materialsForActivity });
                                setPriceSearchExisting(recentResearch);
                                setPriceSearchOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> Ver Pesquisa
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPriceSearchActivity({ id: activity.id, name: activity.name, materials: materialsForActivity });
                              setPriceSearchExisting(undefined);
                              setPriceSearchOpen(true);
                            }}
                          >
                            <Search className="h-3.5 w-3.5 mr-1" /> {hasRecent ? "Nova Pesquisa" : "Pesquisar Preços"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {priceSearchActivity && (
            <PriceSearchDialog
              open={priceSearchOpen}
              onOpenChange={setPriceSearchOpen}
              activityName={priceSearchActivity.name}
              activityId={priceSearchActivity.id}
              projectId={projectId}
              materials={priceSearchActivity.materials}
              existingResearch={priceSearchExisting}
            />
          )}
        </TabsContent>

        <TabsContent value="compras" className="mt-4">
          <ProjectPurchasesTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
