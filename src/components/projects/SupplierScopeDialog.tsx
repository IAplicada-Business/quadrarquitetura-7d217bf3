import { Fragment, useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, MessageCircle, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSupplierScopes } from "@/hooks/useSupplierScopes";
import { ProjectActivity } from "@/hooks/useProjectActivities";
import { getDisciplineColor } from "@/lib/disciplineColors";
import jsPDF from "jspdf";

interface SupplierScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  activities: ProjectActivity[];
}

export function SupplierScopeDialog({ open, onOpenChange, projectId, activities }: SupplierScopeDialogProps) {
  const [supplierId, setSupplierId] = useState("");
  // Um fornecedor pode cobrir várias disciplinas de uma vez (ex.: a
  // construtora que faz alvenaria + hidráulica + cobertura). O escopo é
  // gerado somando todas as selecionadas.
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const { createMany } = useSupplierScopes(projectId);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name, phone").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: project } = useQuery({
    queryKey: ["project_info", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("name, address, city").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    activities.forEach(a => { if (a.discipline) set.add(a.discipline); });
    return Array.from(set).sort();
  }, [activities]);

  const countByDiscipline = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => { if (a.discipline) counts[a.discipline] = (counts[a.discipline] ?? 0) + 1; });
    return counts;
  }, [activities]);

  // Atividades das disciplinas escolhidas, agrupadas — a ordem das disciplinas
  // segue a seleção pra lista, PDF e WhatsApp saírem iguais.
  const groups = useMemo(() => {
    return selectedDisciplines.map(d => ({
      discipline: d,
      items: activities.filter(a => a.discipline === d),
    })).filter(g => g.items.length > 0);
  }, [activities, selectedDisciplines]);

  const totalActivities = groups.reduce((sum, g) => sum + g.items.length, 0);

  const toggleDiscipline = (d: string) => {
    setSelectedDisciplines(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const disciplinesLabel = selectedDisciplines.join(", ");

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(16);
    doc.text("QUADRA Arquitetura", margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Obra: ${project?.name || ""}`, margin, y); y += 6;
    doc.text(`Endereço: ${project?.address || ""}, ${project?.city || ""}`, margin, y); y += 6;
    doc.text(`Fornecedor: ${selectedSupplier?.name || ""}`, margin, y); y += 6;
    doc.text(`Disciplinas: ${disciplinesLabel}`, margin, y); y += 10;

    doc.setFontSize(12);
    doc.text("Escopo para Orçamento", margin, y); y += 8;

    groups.forEach(group => {
      if (y > 260) { doc.addPage(); y = margin; }
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(group.discipline, margin, y); y += 7;

      doc.setFontSize(9);
      doc.text("#", margin, y);
      doc.text("Atividade", margin + 10, y);
      doc.text("Área (m²)", margin + 110, y);
      doc.text("Duração", margin + 145, y);
      y += 6;
      doc.setFont("helvetica", "normal");

      group.items.forEach((a, i) => {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.text(String(i + 1), margin, y);
        doc.text(a.name.substring(0, 50), margin + 10, y);
        doc.text(a.area_m2 != null ? String(a.area_m2) : "-", margin + 110, y);
        doc.text(a.duration_days != null ? `${a.duration_days}d` : "-", margin + 145, y);
        y += 6;
      });
      y += 4;
    });

    const fileSuffix = selectedDisciplines.length === 1 ? selectedDisciplines[0] : `${selectedDisciplines.length}_disciplinas`;
    doc.save(`escopo_${fileSuffix}_${selectedSupplier?.name || "fornecedor"}.pdf`);
  };

  const sendWhatsApp = () => {
    if (!selectedSupplier?.phone) return;
    const phone = selectedSupplier.phone.replace(/\D/g, "");
    const listText = groups.map(group =>
      `*${group.discipline}*\n` + group.items.map((a, i) =>
        `${i + 1}. ${a.name}${a.area_m2 ? ` - ${a.area_m2}m²` : ""}${a.duration_days ? ` - ${a.duration_days}d` : ""}`
      ).join("\n")
    ).join("\n\n");
    const text = `Olá ${selectedSupplier.name}, segue o escopo da obra ${project?.name || ""} para orçamento:\n\n${listText}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSave = () => {
    createMany.mutate(
      groups.map(group => ({
        supplier_id: supplierId,
        discipline: group.discipline,
        activities: group.items.map(a => ({ id: a.id, name: a.name, area_m2: a.area_m2, duration_days: a.duration_days })),
        status: "gerado",
      })),
      { onSuccess: () => onOpenChange(false) }
    );
  };

  useEffect(() => {
    if (!open) { setSupplierId(""); setSelectedDisciplines([]); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Escopo do Fornecedor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5 max-w-sm">
            <label className="text-sm font-medium">Fornecedor</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Disciplinas
                {selectedDisciplines.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-1.5">
                    ({selectedDisciplines.length} selecionada{selectedDisciplines.length > 1 ? "s" : ""})
                  </span>
                )}
              </label>
              {selectedDisciplines.length > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedDisciplines([])}>
                  Limpar
                </Button>
              )}
            </div>
            {disciplines.length === 0 ? (
              <p className="text-sm text-muted-foreground border rounded-lg p-3">
                Nenhuma atividade com disciplina cadastrada nesta obra.
              </p>
            ) : (
              <div className="border rounded-lg p-2 grid grid-cols-2 sm:grid-cols-3 gap-1 max-h-44 overflow-y-auto">
                {disciplines.map(d => (
                  <label
                    key={d}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={selectedDisciplines.includes(d)}
                      onCheckedChange={() => toggleDiscipline(d)}
                    />
                    <span
                      className="truncate flex-1"
                      style={{ color: getDisciplineColor(d) }}
                    >
                      {d}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{countByDiscipline[d]}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {groups.length > 0 && (
          <div className="border rounded-lg overflow-hidden mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="w-24">Área m²</TableHead>
                  <TableHead className="w-24">Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(group => (
                  <Fragment key={group.discipline}>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={4} className="py-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-0"
                          style={{
                            backgroundColor: getDisciplineColor(group.discipline) + "20",
                            color: getDisciplineColor(group.discipline),
                          }}
                        >
                          {group.discipline}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-2">
                          {group.items.length} atividade{group.items.length > 1 ? "s" : ""}
                        </span>
                      </TableCell>
                    </TableRow>
                    {group.items.map((a, i) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell>{a.area_m2 ?? "-"}</TableCell>
                        <TableCell>{a.duration_days ? `${a.duration_days}d` : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedDisciplines.length > 0 && totalActivities === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade encontrada para {selectedDisciplines.length > 1 ? "estas disciplinas" : "esta disciplina"}.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={generatePDF} disabled={!supplierId || !totalActivities}>
            <FileText className="h-4 w-4 mr-1" /> Gerar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={sendWhatsApp} disabled={!selectedSupplier?.phone || !totalActivities}>
            <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!supplierId || !totalActivities || createMany.isPending}>
            {createMany.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
