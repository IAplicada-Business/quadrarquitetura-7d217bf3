import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { startOfWeek, endOfWeek, format, getISOWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientTask {
  id: string;
  task_name: string;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  discipline: string | null;
  color: string | null;
  progress_percentage: number | null;
}

interface ClientScheduleViewProps {
  tasks: ClientTask[];
  projectName?: string;
}

const statusLabels: Record<string, string> = {
  planejado: "Planejado",
  em_execucao: "Em Execução",
  executado: "Concluído",
  atrasado: "Atrasado",
};

export function ClientScheduleView({ tasks, projectName }: ClientScheduleViewProps) {
  const [copied, setCopied] = useState(false);

  const weekGroups = useMemo(() => {
    const groups: Record<string, { weekLabel: string; startDate: Date; tasks: ClientTask[] }> = {};

    tasks.forEach(task => {
      if (!task.start_date) return;
      const date = new Date(task.start_date);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      const key = format(weekStart, "yyyy-ww");
      const weekLabel = `${format(weekStart, "dd/MM")} a ${format(weekEnd, "dd/MM")}`;

      if (!groups[key]) groups[key] = { weekLabel, startDate: weekStart, tasks: [] };
      groups[key].tasks.push(task);
    });

    return Object.values(groups).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [tasks]);

  const handleCopy = async () => {
    let html = `<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">`;
    html += `<h2 style="color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">📅 Cronograma — ${projectName || "Obra"}</h2>`;

    weekGroups.forEach((group, i) => {
      html += `<div style="margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">`;
      html += `<h3 style="margin: 0 0 8px; color: #334155; font-size: 14px;">Semana ${i + 1} — ${group.weekLabel}</h3>`;
      group.tasks.forEach(task => {
        const statusIcon = task.status === "executado" ? "✅" : task.status === "em_execucao" ? "🔄" : task.status === "atrasado" ? "⚠️" : "📋";
        html += `<div style="padding: 4px 0; font-size: 13px; color: #475569;">${statusIcon} ${task.task_name}${task.discipline ? ` <span style="color: #94a3b8;">(${task.discipline})</span>` : ""}</div>`;
      });
      html += `</div>`;
    });

    html += `<p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px;">Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>`;
    html += `</div>`;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([weekGroups.map((g, i) =>
            `Semana ${i + 1} (${g.weekLabel}):\n${g.tasks.map(t => `  • ${t.task_name}`).join("\n")}`
          ).join("\n\n")], { type: "text/plain" }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(
        weekGroups.map((g, i) =>
          `Semana ${i + 1} (${g.weekLabel}):\n${g.tasks.map(t => `  • ${t.task_name}`).join("\n")}`
        ).join("\n\n")
      );
    }

    setCopied(true);
    toast({ title: "Cronograma copiado para envio!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-display">Visão do Cliente</h3>
          <p className="text-sm text-muted-foreground">Resumo semanal das fases da obra</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? "Copiado!" : "Copiar para Enviar"}
        </Button>
      </div>

      {weekGroups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhuma etapa visível para o cliente. Marque tarefas como "Visível para cliente" no formulário.
        </div>
      ) : (
        <div className="grid gap-3">
          {weekGroups.map((group, i) => (
            <Card key={i} className="border-l-4" style={{ borderLeftColor: group.tasks[0]?.color || "#3b82f6" }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-display">Semana {i + 1}</h4>
                  <span className="text-xs text-muted-foreground">{group.weekLabel}</span>
                </div>
                <div className="space-y-1.5">
                  {group.tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.color || "#3b82f6" }} />
                      <span className="text-sm">{task.task_name}</span>
                      {task.discipline && (
                        <Badge variant="outline" className="text-[10px] h-4">{task.discipline}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {statusLabels[task.status || "planejado"]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
