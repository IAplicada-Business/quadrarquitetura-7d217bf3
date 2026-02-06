import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaterialCalc } from "@/hooks/useMaterialCalc";
import { useMaterialTracking } from "@/hooks/useMaterialTracking";
import { MaterialCalcForm } from "./MaterialCalcForm";
import { MaterialTrackingForm } from "./MaterialTrackingForm";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

export function ProjectMaterialsTab({ projectId }: { projectId: string }) {
  const calc = useMaterialCalc(projectId);
  const tracking = useMaterialTracking(projectId);
  const [calcFormOpen, setCalcFormOpen] = useState(false);
  const [trackFormOpen, setTrackFormOpen] = useState(false);
  const [editingCalc, setEditingCalc] = useState<Record<string, unknown> | null>(null);
  const [editingTrack, setEditingTrack] = useState<Record<string, unknown> | null>(null);

  // Group calc items by category
  const grouped = calc.items.reduce<Record<string, typeof calc.items>>((acc, item) => {
    const cat = item.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs defaultValue="calculo">
        <TabsList>
          <TabsTrigger value="calculo">Memória de Cálculo</TabsTrigger>
          <TabsTrigger value="rastreamento">Rastreamento</TabsTrigger>
        </TabsList>

        <TabsContent value="calculo" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-display">Memória de Cálculo</h3>
              <p className="text-sm text-muted-foreground">Cálculo de quantidades de materiais por categoria</p>
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

        <TabsContent value="rastreamento" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-display">Rastreamento de Materiais</h3>
              <p className="text-sm text-muted-foreground">Controle: necessário → comprado → entregue → usado</p>
            </div>
            <Button size="sm" onClick={() => { setEditingTrack(null); setTrackFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Novo Material
            </Button>
          </div>

          {tracking.isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : tracking.items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum material rastreado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-center">Necessário</TableHead>
                  <TableHead className="text-center">Comprado</TableHead>
                  <TableHead className="text-center">Entregue</TableHead>
                  <TableHead className="text-center">Usado</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tracking.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.material_name}</TableCell>
                    <TableCell className="text-center">{item.quantity_needed ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <div>{item.quantity_purchased ?? "—"}</div>
                      {item.purchase_date && <div className="text-xs text-muted-foreground">{formatDate(item.purchase_date)}</div>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div>{item.quantity_delivered ?? "—"}</div>
                      {item.delivery_date && <div className="text-xs text-muted-foreground">{formatDate(item.delivery_date)}</div>}
                    </TableCell>
                    <TableCell className="text-center">{item.quantity_used ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">{item.notes || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingTrack(item as Record<string, unknown>); setTrackFormOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => tracking.remove.mutate(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      <MaterialCalcForm
        open={calcFormOpen}
        onOpenChange={setCalcFormOpen}
        onSubmit={(data) => {
          if (editingCalc) {
            calc.update.mutate({ id: editingCalc.id as string, ...data });
          } else {
            calc.create.mutate(data);
          }
          setEditingCalc(null);
        }}
        initialData={editingCalc}
        isLoading={calc.create.isPending || calc.update.isPending}
      />

      <MaterialTrackingForm
        open={trackFormOpen}
        onOpenChange={setTrackFormOpen}
        onSubmit={(data) => {
          if (editingTrack) {
            tracking.update.mutate({ id: editingTrack.id as string, ...data });
          } else {
            tracking.create.mutate(data);
          }
          setEditingTrack(null);
        }}
        initialData={editingTrack}
        isLoading={tracking.create.isPending || tracking.update.isPending}
      />
    </div>
  );
}
