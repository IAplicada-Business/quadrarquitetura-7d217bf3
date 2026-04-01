import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Camera } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  avgProgress: number;
  onSubmit: (data: {
    week_start: string;
    summary: string;
    next_steps: string;
    completion_percent: number;
    client_pending?: string;
    photos?: File[];
  }) => void;
  isPending: boolean;
  prefill?: { summary: string; next_steps: string; client_pending?: string };
}

export function WeeklyReportModal({ open, onOpenChange, avgProgress, onSubmit, isPending, prefill }: Props) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const [summary, setSummary] = useState(prefill?.summary || "");
  const [nextSteps, setNextSteps] = useState(prefill?.next_steps || "");
  const [completionPercent, setCompletionPercent] = useState(avgProgress);
  const [clientPending, setClientPending] = useState(prefill?.client_pending || "");
  const [photos, setPhotos] = useState<File[]>([]);

  // Update fields when prefill changes
  useEffect(() => {
    if (prefill) {
      setSummary(prefill.summary || "");
      setNextSteps(prefill.next_steps || "");
      setClientPending(prefill.client_pending || "");
    }
  }, [prefill]);

  const weekLabel = useMemo(
    () =>
      `Semana de ${format(weekStart, "dd", { locale: ptBR })} a ${format(weekEnd, "dd 'de' MMMM", { locale: ptBR })}`,
    [weekStart, weekEnd]
  );

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 6);
    setPhotos(files);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      week_start: format(weekStart, "yyyy-MM-dd"),
      summary,
      next_steps: nextSteps,
      completion_percent: completionPercent,
      client_pending: clientPending || undefined,
      photos: photos.length > 0 ? photos : undefined,
    });
    setSummary("");
    setNextSteps("");
    setCompletionPercent(avgProgress);
    setClientPending("");
    setPhotos([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Relatório Semanal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Período</Label>
            <p className="text-sm text-muted-foreground mt-1">{weekLabel}</p>
          </div>

          <div>
            <Label>Resumo do período *</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Descreva as atividades realizadas nesta semana..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label>Próximas etapas *</Label>
            <Textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="O que está planejado para a próxima semana..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label>% de Conclusão Geral</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={completionPercent}
              onChange={(e) => setCompletionPercent(Number(e.target.value))}
            />
          </div>

          <div>
            <Label className="flex items-center gap-1.5">
              <Camera className="h-4 w-4" />
              Fotos da semana (máx. 6)
            </Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
              className="mt-1"
            />
            {photos.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {photos.length} foto(s) selecionada(s)
              </p>
            )}
          </div>

          <div>
            <Label>Pendências do cliente (opcional)</Label>
            <Textarea
              value={clientPending}
              onChange={(e) => setClientPending(e.target.value)}
              placeholder="Itens que precisam de ação ou aprovação do cliente..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Gerar Relatório"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
