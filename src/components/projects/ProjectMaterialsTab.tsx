import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Download, ExternalLink, ShoppingCart, Package, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMaterialCalc } from "@/hooks/useMaterialCalc";
import { useMaterialTracking } from "@/hooks/useMaterialTracking";
import { useProjectPurchases } from "@/hooks/useProjectPurchases";
import { useScopeItems } from "@/hooks/useScopeItems";
import { MaterialCalcForm } from "./MaterialCalcForm";
import { MaterialTrackingForm } from "./MaterialTrackingForm";
import { ProjectPurchasesTab } from "./ProjectPurchasesTab";
import { SupplierPurchaseList } from "./SupplierPurchaseList";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getDisciplineColor } from "@/lib/disciplineColors";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export function ProjectMaterialsTab({ projectId }: { projectId: string }) {
  const calc = useMaterialCalc(projectId);
  const tracking = useMaterialTracking(projectId);
  const purchases = useProjectPurchases(projectId);
  const { items: scopeItems } = useScopeItems(projectId);
  const [calcFormOpen, setCalcFormOpen] = useState(false);
  const [trackFormOpen, setTrackFormOpen] = useState(false);
  const [editingCalc, setEditingCalc] = useState<Record<string, unknown> | null>(null);
  const [editingTrack, setEditingTrack] = useState<Record<string, unknown> | null>(null);
  const [supplierListOpen, setSupplierListOpen] = useState(false);
  const [filterDiscipline, setFilterDiscipline] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Query schedule_tasks with materials
  const { data: taskMaterials = [] } = useQuery({
    queryKey: ["task-materials", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("schedule_tasks")
        .select("id, task_name, materials, discipline, environment")
        .eq("project_id", projectId)
        .not("materials", "is", null);
      return (data || []).filter((t: any) => {
        const mats = t.materials as any[];
        return Array.isArray(mats) && mats.length > 0 && mats.some((m: any) => m.name?.trim());
      });
    },
  });
  const disciplines = useMemo(() => {
    const set = new Set<string>();
    scopeItems.filter(s => !s.parent_id).forEach(s => set.add(s.discipline));
    tracking.items.forEach((m: any) => m.discipline && set.add(m.discipline));
    return Array.from(set).sort();
  }, [scopeItems, tracking.items]);

  const filteredTracking = useMemo(() => {
    return tracking.items.filter((item: any) => {
      if (filterDiscipline !== "all" && item.discipline !== filterDiscipline) return false;
      if (filterStatus === "pendente" && (item.quantity_purchased ?? 0) >= (item.quantity_needed ?? 0)) return false;
      if (filterStatus === "comprado" && (item.quantity_purchased ?? 0) === 0) return false;
      if (filterStatus === "entregue" && (item.quantity_delivered ?? 0) === 0) return false;
      return true;
    });
  }, [tracking.items, filterDiscipline, filterStatus]);

  // Metrics
  const totalItems = tracking.items.length;
  const pendingPurchase = tracking.items.filter((m: any) => (m.quantity_purchased ?? 0) < (m.quantity_needed ?? 1)).length;
  const delivered = tracking.items.filter((m: any) => (m.quantity_delivered ?? 0) > 0).length;
  const completePct = totalItems > 0
    ? Math.round((tracking.items.filter((m: any) => (m.quantity_delivered ?? 0) >= (m.quantity_needed ?? 1)).length / totalItems) * 100)
    : 0;

  const grouped = calc.items.reduce<Record<string, typeof calc.items>>((acc, item) => {
    const cat = item.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleGeneratePurchase = (item: any) => {
    purchases.create.mutate({
      name: item.material_name,
      category: item.discipline || "Material",
      supplier_name: item.supplier_name || "",
      product_link: item.product_link || "",
      specifications: `Qtd necessária: ${item.quantity_needed ?? "—"}`,
      status: "pendente",
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs defaultValue="rastreamento">
        <TabsList>
          <TabsTrigger value="rastreamento">Rastreamento</TabsTrigger>
          <TabsTrigger value="calculo">Memória de Cálculo</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
        </TabsList>

        {/* ===== RASTREAMENTO ===== */}
        <TabsContent value="rastreamento" className="space-y-4 mt-4">
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-display">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Total de Itens</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">{pendingPurchase}</p>
              <p className="text-xs text-muted-foreground">Pendentes de Compra</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{delivered}</p>
              <p className="text-xs text-muted-foreground">Entregues</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{completePct}%</p>
              <p className="text-xs text-muted-foreground">Completo</p>
            </CardContent></Card>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex gap-2">
              <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Disciplinas</SelectItem>
                  {disciplines.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="comprado">Comprados</SelectItem>
                  <SelectItem value="entregue">Entregues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => tracking.importFromBudget.mutate()} disabled={tracking.importFromBudget.isPending}>
                <Download className="h-4 w-4 mr-1" /> Importar do Orçamento
              </Button>
              <Button size="sm" onClick={() => { setEditingTrack(null); setTrackFormOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Novo Material
              </Button>
            </div>
          </div>

          {/* Table */}
          {tracking.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredTracking.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              {totalItems === 0 ? "Nenhum material rastreado. Importe do orçamento ou adicione manualmente." : "Nenhum item encontrado com os filtros selecionados."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead className="w-12">Unid.</TableHead>
                    <TableHead className="text-center">Necessário</TableHead>
                    <TableHead className="text-center">Comprado</TableHead>
                    <TableHead className="text-center">Entregue</TableHead>
                    <TableHead className="text-center">Usado</TableHead>
                    <TableHead className="w-24">Progresso</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTracking.map((item: any) => {
                    const needed = item.quantity_needed ?? 0;
                    const purchased = item.quantity_purchased ?? 0;
                    const pct = needed > 0 ? Math.min(100, Math.round((purchased / needed) * 100)) : 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.material_name}</div>
                          {item.source === "orcamento" && <Badge variant="outline" className="text-[10px] mt-0.5">Orçamento</Badge>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.discipline || "—"}</TableCell>
                        <TableCell className="text-xs">{item.unit || "—"}</TableCell>
                        <TableCell className="text-center">{item.quantity_needed ?? "—"}</TableCell>
                        <TableCell className="text-center">{item.quantity_purchased ?? "—"}</TableCell>
                        <TableCell className="text-center">{item.quantity_delivered ?? "—"}</TableCell>
                        <TableCell className="text-center">{item.quantity_used ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-[10px] text-muted-foreground w-8">{pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{item.supplier_name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {item.product_link && (
                              <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                <a href={item.product_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a>
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Gerar Compra" onClick={() => handleGeneratePurchase(item)}>
                              <ShoppingCart className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingTrack(item as Record<string, unknown>); setTrackFormOpen(true); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => tracking.remove.mutate(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ===== MEMÓRIA DE CÁLCULO ===== */}
        <TabsContent value="calculo" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-display">Memória de Cálculo</h3>
              <p className="text-sm text-muted-foreground">Cálculo de quantidades por categoria. Regras configuráveis em Configurações.</p>
            </div>
            <Button size="sm" onClick={() => { setEditingCalc(null); setCalcFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Novo Item
            </Button>
          </div>

          {calc.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum item de cálculo cadastrado.
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-semibold text-sm text-display flex items-center gap-2">
                  <Badge variant="outline">{category}</Badge>
                  <span className="text-muted-foreground text-xs">({items.length} itens)</span>
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-20">Qtd</TableHead>
                      <TableHead className="w-16">Unid.</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>{item.quantity ?? "—"}</TableCell>
                        <TableCell>{item.unit || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{item.notes || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingCalc(item as Record<string, unknown>); setCalcFormOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => calc.remove.mutate(item.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </TabsContent>

        {/* ===== COMPRAS ===== */}
        <TabsContent value="compras" className="space-y-4 mt-4">
          <div className="flex justify-end mb-2">
            <Button size="sm" variant="outline" onClick={() => setSupplierListOpen(true)} disabled={purchases.items.length === 0}>
              <Package className="h-4 w-4 mr-1" /> Lista por Fornecedor
            </Button>
          </div>
          <ProjectPurchasesTab projectId={projectId} />
        </TabsContent>
      </Tabs>

      <MaterialCalcForm
        open={calcFormOpen}
        onOpenChange={setCalcFormOpen}
        onSubmit={(data) => {
          if (editingCalc) calc.update.mutate({ id: editingCalc.id as string, ...data });
          else calc.create.mutate(data);
          setEditingCalc(null);
        }}
        initialData={editingCalc}
        isLoading={calc.create.isPending || calc.update.isPending}
      />

      <MaterialTrackingForm
        open={trackFormOpen}
        onOpenChange={setTrackFormOpen}
        onSubmit={(data) => {
          if (editingTrack) tracking.update.mutate({ id: editingTrack.id as string, ...data });
          else tracking.create.mutate(data);
          setEditingTrack(null);
        }}
        initialData={editingTrack}
        isLoading={tracking.create.isPending || tracking.update.isPending}
        disciplines={disciplines}
      />

      <SupplierPurchaseList
        open={supplierListOpen}
        onOpenChange={setSupplierListOpen}
        items={purchases.items.map(p => ({
          name: p.name,
          supplier_name: p.supplier_name,
          value: p.value,
          specifications: p.specifications,
          status: p.status,
        }))}
      />
    </div>
  );
}
