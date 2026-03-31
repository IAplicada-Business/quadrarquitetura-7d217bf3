import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator } from "lucide-react";
import { useMaterialIndices, type MaterialIndex } from "@/hooks/useMaterialIndices";
import { useProjectActivities, type ProjectActivity } from "@/hooks/useProjectActivities";
import { useMaterialTracking } from "@/hooks/useMaterialTracking";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface CalculatedItem {
  key: string;
  material_name: string;
  unit: string;
  discipline: string;
  calculated_qty: number;
  adjusted_qty: number;
  selected: boolean;
  activity_name: string;
}

export function MaterialCalcByActivitiesDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const { indices } = useMaterialIndices();
  const { activities } = useProjectActivities(projectId);
  const tracking = useMaterialTracking(projectId);
  const { user } = useAuth();
  const [items, setItems] = useState<CalculatedItem[]>([]);
  const [importing, setImporting] = useState(false);

  const calculate = () => {
    const validActivities = activities.filter(a => a.area_m2 && a.area_m2 > 0);
    const result: CalculatedItem[] = [];

    for (const activity of validActivities) {
      const disc = (activity.discipline || "").toLowerCase();
      const matching = indices.filter(idx => idx.activity_type.toLowerCase() === disc);
      for (const idx of matching) {
        const qty = Number(activity.area_m2) * Number(idx.index_per_m2);
        const key = `${activity.id}-${idx.id}`;
        result.push({
          key,
          material_name: idx.material_name,
          unit: idx.unit,
          discipline: activity.discipline || "",
          calculated_qty: Math.ceil(qty * 100) / 100,
          adjusted_qty: Math.ceil(qty * 100) / 100,
          selected: true,
          activity_name: activity.name,
        });
      }
    }
    setItems(result);
    setOpen(true);
  };

  const toggleItem = (key: string) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, selected: !i.selected } : i));
  };

  const updateQty = (key: string, val: number) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, adjusted_qty: val } : i));
  };

  const handleImport = async () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) return;

    setImporting(true);
    const existingNames = new Set(tracking.items.map((t: any) => t.material_name?.toLowerCase()));

    let added = 0;
    let skipped = 0;

    for (const item of selected) {
      if (existingNames.has(item.material_name.toLowerCase())) {
        skipped++;
        continue;
      }
      try {
        await new Promise<void>((resolve, reject) => {
          tracking.create.mutate(
            {
              material_name: item.material_name,
              unit: item.unit,
              discipline: item.discipline,
              quantity_needed: item.adjusted_qty,
              source: "indices",
            },
            { onSuccess: () => resolve(), onError: (e) => reject(e) }
          );
        });
        existingNames.add(item.material_name.toLowerCase());
        added++;
      } catch {
        // skip on error
      }
    }

    setImporting(false);
    toast({
      title: "Importação concluída",
      description: `${added} itens adicionados${skipped > 0 ? `, ${skipped} duplicatas ignoradas` : ""}`,
    });
    setOpen(false);
  };

  const hasActivitiesWithArea = activities.some(a => a.area_m2 && a.area_m2 > 0);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={calculate}
        disabled={!hasActivitiesWithArea || indices.length === 0}
        title={!hasActivitiesWithArea ? "Nenhuma atividade com área m² definida" : ""}
      >
        <Calculator className="h-4 w-4 mr-1" /> Calcular por Atividades
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cálculo de Materiais por Atividades</DialogTitle>
          </DialogHeader>

          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum índice compatível encontrado para as atividades deste projeto.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Material</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="w-16">Unid.</TableHead>
                  <TableHead className="w-24 text-right">Calculado</TableHead>
                  <TableHead className="w-28 text-right">Ajustado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.key} className={!item.selected ? "opacity-50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItem(item.key)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.material_name}</div>
                      <Badge variant="outline" className="text-[10px]">{item.discipline}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.activity_name}</TableCell>
                    <TableCell className="text-xs">{item.unit}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.calculated_qty}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={item.adjusted_qty}
                        onChange={e => updateQty(item.key, Number(e.target.value))}
                        className="h-7 w-24 text-right text-sm"
                        min={0}
                        step={0.01}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleImport}
              disabled={importing || items.filter(i => i.selected).length === 0}
            >
              {importing ? "Importando..." : `Importar ${items.filter(i => i.selected).length} para Lista`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
