import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const [discipline, setDiscipline] = useState("");
  const { create } = useSupplierScopes(projectId);

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

  const filtered = useMemo(() => {
    if (!discipline) return [];
    return activities.filter(a => a.discipline === discipline);
  }, [activities, discipline]);

  const selectedSupplier = suppliers.find(s => s.id === supplierId);

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
    doc.text(`Disciplina: ${discipline}`, margin, y); y += 10;

    doc.setFontSize(12);
    doc.text("Escopo para Orçamento", margin, y); y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("#", margin, y);
    doc.text("Atividade", margin + 10, y);
    doc.text("Área (m²)", margin + 110, y);
    doc.text("Duração", margin + 145, y);
    y += 6;
    doc.setFont("helvetica", "normal");

    filtered.forEach((a, i) => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.text(String(i + 1), margin, y);
      doc.text(a.name.substring(0, 50), margin + 10, y);
      doc.text(a.area_m2 != null ? String(a.area_m2) : "-", margin + 110, y);
      doc.text(a.duration_days != null ? `${a.duration_days}d` : "-", margin + 145, y);
      y += 6;
    });

    doc.save(`escopo_${discipline}_${selectedSupplier?.name || "fornecedor"}.pdf`);
  };

  const sendWhatsApp = () => {
    if (!selectedSupplier?.phone) return;
    const phone = selectedSupplier.phone.replace(/\D/g, "");
    const listText = filtered.map((a, i) =>
      `${i + 1}. ${a.name}${a.area_m2 ? ` - ${a.area_m2}m²` : ""}${a.duration_days ? ` - ${a.duration_days}d` : ""}`
    ).join("\n");
    const text = `Olá ${selectedSupplier.name}, segue o escopo da obra ${project?.name || ""} para orçamento:\n\n${listText}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSave = () => {
    create.mutate({
      supplier_id: supplierId,
      discipline,
      activities: filtered.map(a => ({ id: a.id, name: a.name, area_m2: a.area_m2, duration_days: a.duration_days })),
      status: "gerado",
    });
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) { setSupplierId(""); setDiscipline(""); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Escopo do Fornecedor</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fornecedor</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Selecionar fornecedor" /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Disciplina</label>
            <Select value={discipline} onValueChange={setDiscipline}>
              <SelectTrigger><SelectValue placeholder="Selecionar disciplina" /></SelectTrigger>
              <SelectContent>
                {disciplines.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length > 0 && (
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
                {filtered.map((a, i) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.area_m2 ?? "-"}</TableCell>
                    <TableCell>{a.duration_days ? `${a.duration_days}d` : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {discipline && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade encontrada para esta disciplina.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={generatePDF} disabled={!supplierId || !filtered.length}>
            <FileText className="h-4 w-4 mr-1" /> Gerar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={sendWhatsApp} disabled={!selectedSupplier?.phone || !filtered.length}>
            <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!supplierId || !discipline || create.isPending}>
            {create.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
