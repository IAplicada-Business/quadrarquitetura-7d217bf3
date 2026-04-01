import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupplierAllocations } from "@/hooks/useSupplierAllocations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation: {
    id: string;
    supplier_id: string;
    contracted_value?: number | null;
    notes?: string | null;
    rating?: number | null;
    suppliers?: { name: string };
  } | null;
}

export function SupplierRatingDialog({ open, onOpenChange, allocation }: Props) {
  const { update } = useSupplierAllocations();
  const [rating, setRating] = useState(allocation?.rating || 0);
  const [notes, setNotes] = useState(allocation?.notes || "");
  const [finalValue, setFinalValue] = useState(
    allocation?.contracted_value?.toString() || ""
  );

  // Reset on open
  const handleOpenChange = (v: boolean) => {
    if (v && allocation) {
      setRating(allocation.rating || 0);
      setNotes(allocation.notes || "");
      setFinalValue(allocation.contracted_value?.toString() || "");
    }
    onOpenChange(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocation) return;
    update.mutate({
      id: allocation.id,
      rating: rating || null,
      notes: notes || null,
      final_value: finalValue ? Number(finalValue) : null,
    });
    onOpenChange(false);
  };

  if (!allocation) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Avaliar {allocation.suppliers?.name || "Fornecedor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Avaliação</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRating(v)}
                  className={`text-2xl transition-colors ${v <= rating ? "text-yellow-400" : "text-muted-foreground/30"} hover:text-yellow-400`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Valor Final Pago (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={finalValue}
              onChange={(e) => setFinalValue(e.target.value)}
              placeholder="Valor final"
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qualidade do trabalho, pontualidade..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
