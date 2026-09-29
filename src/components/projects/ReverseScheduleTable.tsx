import { useMemo, useState, type KeyboardEvent } from "react";
import { AlertTriangle, ArrowDownUp, Check, Flag, Home, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CascadePreviewDialog } from "./CascadePreviewDialog";
import { computeCascade, type CascadeChange, type ProjectActivity } from "@/hooks/useProjectActivities";
import { computeCriticalPath } from "@/lib/criticalPath";
import {
  applyReverseEdit,
  businessDaysUntil,
  computeReverseMetrics,
  todayIso,
  type ReverseDatePatch,
  type ReverseEditField,
} from "@/lib/reverseSchedule";
import { getDisciplineColor } from "@/lib/disciplineColors";

export type ReverseFilter = "all" | "critical" | "overdue" | "open";

interface Props {
  activities: ProjectActivity[];
  isLoading?: boolean;
  /** Data da mudança do cliente (projects.client_move_in_date). */
  moveInDate?: string | null;
  /** Persiste as datas editadas de uma atividade. */
  onUpdateDates: (patch: { id: string } & ReverseDatePatch) => void;
  /** Aplica o deslocamento das atividades dependentes (mesma lógica do Gantt). */
  onCascade?: (updates: { id: string; start_date: string; end_date: string }[]) => void;
  isSaving?: boolean;
  /** Só para testes: fixa a data de hoje (YYYY-MM-DD). */
  today?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  bloqueada: "Bloqueada",
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* ------------------------------------------------------------------ */
/* Células editáveis inline                                            */
/* ------------------------------------------------------------------ */

function InlineDateCell({
  value,
  label,
  onCommit,
  disabled,
}: {
  value: string | null;
  label: string;
  onCommit: (iso: string) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        type="date"
        aria-label={label}
        autoFocus
        defaultValue={value ?? ""}
        className="h-8 w-[140px] rounded-md border border-input bg-background px-2 text-sm"
        onChange={(e) => {
          if (e.target.value) {
            onCommit(e.target.value);
            setEditing(false);
          }
        }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Escape") setEditing(false);
          if (e.key === "Enter" && e.currentTarget.value) {
            onCommit(e.currentTarget.value);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => setEditing(true)}
      className="group/cell inline-flex items-center gap-1.5 rounded px-1.5 py-1 -mx-1.5 text-sm hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
    >
      <span className={value ? "" : "text-muted-foreground"}>{fmtDate(value)}</span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100" />
    </button>
  );
}

function InlineNumberCell({
  value,
  label,
  onCommit,
  disabled,
}: {
  value: number | null;
  label: string;
  onCommit: (n: number) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n >= 1 && n !== value) onCommit(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="number"
        min={1}
        aria-label={label}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-8 w-[72px] rounded-md border border-input bg-background px-2 text-sm text-center"
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        setDraft(value != null ? String(value) : "");
        setEditing(true);
      }}
      className="group/cell inline-flex items-center gap-1.5 rounded px-1.5 py-1 -mx-1.5 text-sm tabular-nums hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
    >
      <span className={value != null ? "" : "text-muted-foreground"}>{value ?? "—"}</span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Tabela                                                              */
/* ------------------------------------------------------------------ */

export function ReverseScheduleTable({ activities, isLoading, moveInDate, onUpdateDates, onCascade, isSaving, today: todayProp }: Props) {
  const today = todayProp ?? todayIso();
  const [filter, setFilter] = useState<ReverseFilter>("all");
  const [reverseOrder, setReverseOrder] = useState(true);
  const [pendingCascade, setPendingCascade] = useState<CascadeChange[]>([]);

  const cpm = useMemo(
    () =>
      computeCriticalPath(
        activities.map((a) => ({ id: a.id, start_date: a.start_date, duration: a.duration_days, dependencies: a.depends_on })),
      ),
    [activities],
  );

  const rows = useMemo(() => {
    const list = activities.map((a) => ({
      activity: a,
      metrics: computeReverseMetrics(a, today),
      isCritical: cpm.criticalIds.has(a.id),
      float: cpm.floatMap.get(a.id),
    }));
    list.sort((x, y) => {
      const kx = x.activity.end_date ?? x.activity.start_date ?? "";
      const ky = y.activity.end_date ?? y.activity.start_date ?? "";
      if (kx === ky) return (x.activity.position ?? 0) - (y.activity.position ?? 0);
      return reverseOrder ? ky.localeCompare(kx) : kx.localeCompare(ky);
    });
    return list;
  }, [activities, cpm, today, reverseOrder]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "critical":
        return rows.filter((r) => r.isCritical || r.metrics.isOverdue);
      case "overdue":
        return rows.filter((r) => r.metrics.isOverdue);
      case "open":
        return rows.filter((r) => !r.metrics.isFinished);
      default:
        return rows;
    }
  }, [rows, filter]);

  const summary = useMemo(() => {
    const dated = activities.filter((a) => a.end_date || a.start_date);
    const projectEnd = dated.reduce<string | null>((max, a) => {
      const e = a.end_date ?? a.start_date!;
      return !max || e > max ? e : max;
    }, null);
    const overdueCount = rows.filter((r) => r.metrics.isOverdue).length;
    const remainingTotal = rows.reduce((s, r) => s + (r.metrics.remainingDays ?? 0), 0);
    return {
      projectEnd,
      daysToEnd: projectEnd ? businessDaysUntil(projectEnd, today) : null,
      daysToMoveIn: moveInDate ? businessDaysUntil(moveInDate, today) : null,
      exceedsMoveIn: !!(moveInDate && projectEnd && projectEnd > moveInDate),
      criticalCount: cpm.criticalCount,
      overdueCount,
      remainingTotal,
    };
  }, [activities, rows, cpm.criticalCount, moveInDate, today]);

  const handleEdit = (activity: ProjectActivity, field: ReverseEditField, value: string | number) => {
    const patch = applyReverseEdit(activity, field, value);
    if (!patch) return;
    if (patch.start_date === activity.start_date && patch.end_date === activity.end_date && patch.duration_days === activity.duration_days) return;
    onUpdateDates({ id: activity.id, ...patch });

    // Término mudou: dependentes seguem a lógica do Gantt (confirmação em cascata).
    if (onCascade && patch.end_date !== activity.end_date) {
      const changes = computeCascade(activity.id, patch.end_date, activities);
      if (changes.length > 0) setPendingCascade(changes);
    }
  };

  const confirmCascade = () => {
    onCascade?.(pendingCascade.map((c) => ({ id: c.id, start_date: c.newStart, end_date: c.newEnd })));
    setPendingCascade([]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        Nenhuma atividade cadastrada. Crie etapas no Gantt (Nova Etapa ou Importar do Escopo) para montar o cronograma reverso.
      </div>
    );
  }

  const filterButtons: { value: ReverseFilter; label: string; count?: number }[] = [
    { value: "all", label: "Todas", count: rows.length },
    { value: "critical", label: "Marcos críticos", count: rows.filter((r) => r.isCritical || r.metrics.isOverdue).length },
    { value: "overdue", label: "Atrasadas", count: summary.overdueCount },
    { value: "open", label: "Em aberto", count: rows.filter((r) => !r.metrics.isFinished).length },
  ];

  return (
    <div className="space-y-4">
      {/* Resumo reverso */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-display">{summary.projectEnd ? fmtDate(summary.projectEnd) : "—"}</p>
            <p className="text-xs text-muted-foreground">Término previsto da obra</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${summary.daysToEnd != null && summary.daysToEnd < 0 ? "text-destructive" : "text-primary"}`} data-testid="days-to-end">
              {summary.daysToEnd == null ? "—" : summary.daysToEnd}
            </p>
            <p className="text-xs text-muted-foreground">Dias úteis até o término</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{summary.criticalCount}</p>
            <p className="text-xs text-muted-foreground">Marcos críticos</p>
          </CardContent>
        </Card>
        <Card className={summary.exceedsMoveIn ? "border-destructive/40" : ""}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${summary.exceedsMoveIn ? "text-destructive" : "text-success"}`} data-testid="days-to-move-in">
              {summary.daysToMoveIn == null ? "—" : summary.daysToMoveIn}
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Home className="h-3 w-3" /> Dias úteis até a mudança{moveInDate ? ` (${fmtDate(moveInDate)})` : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {summary.exceedsMoveIn && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm flex items-center gap-2" role="alert">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          O término previsto ({fmtDate(summary.projectEnd)}) passa da data de mudança ({fmtDate(moveInDate)}). Ajuste as datas dos marcos críticos.
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtro do cronograma reverso">
          {filterButtons.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
            >
              {f.value === "critical" && <Flag className="h-3 w-3 mr-1" />}
              {f.label}
              {f.count != null && <span className="ml-1.5 opacity-70">{f.count}</span>}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-xs text-muted-foreground">Salvando…</span>}
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setReverseOrder((v) => !v)} title="Inverter ordem">
            <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
            {reverseOrder ? "Do fim para o começo" : "Do começo para o fim"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Clique em uma data ou no prazo para editar direto na tabela. Dias úteis excluem fins de semana, feriados nacionais e o recesso de fim de ano.
        Marcos críticos são as atividades sem folga no caminho crítico (mesmo cálculo do Gantt) e as atrasadas.
      </p>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[220px]">Atividade</TableHead>
              <TableHead>Início previsto</TableHead>
              <TableHead className="text-center">Prazo (dias úteis)</TableHead>
              <TableHead>Prazo final</TableHead>
              <TableHead className="text-center">Dias trabalhados</TableHead>
              <TableHead className="text-center">Dias faltantes</TableHead>
              <TableHead className="text-center">Folga</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  Nenhuma atividade neste filtro.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(({ activity: a, metrics: m, isCritical, float }) => {
              const disabled = !!isSaving;
              return (
                <TableRow
                  key={a.id}
                  data-testid={`reverse-row-${a.id}`}
                  className={m.isOverdue ? "bg-destructive/5" : isCritical ? "bg-warning/5" : undefined}
                >
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      {isCritical && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Flag className="h-3.5 w-3.5 text-destructive shrink-0" aria-label="Marco crítico" />
                            </TooltipTrigger>
                            <TooltipContent>Marco crítico: sem folga, qualquer atraso adia o fim da obra.</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.name}</p>
                        {a.discipline && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: getDisciplineColor(a.discipline) }} />
                            {a.discipline}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <InlineDateCell
                      value={a.start_date}
                      label={`Editar início de ${a.name}`}
                      disabled={disabled}
                      onCommit={(iso) => handleEdit(a, "start_date", iso)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <InlineNumberCell
                      value={m.totalDays}
                      label={`Editar prazo de ${a.name}`}
                      disabled={disabled}
                      onCommit={(n) => handleEdit(a, "duration_days", n)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineDateCell
                      value={a.end_date}
                      label={`Editar término de ${a.name}`}
                      disabled={disabled}
                      onCommit={(iso) => handleEdit(a, "end_date", iso)}
                    />
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums" data-testid={`worked-${a.id}`}>
                    {m.workedDays ?? "—"}
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums" data-testid={`remaining-${a.id}`}>
                    {m.remainingDays == null ? (
                      "—"
                    ) : m.isOverdue ? (
                      <span className="text-destructive font-semibold">−{m.overdueDays}</span>
                    ) : m.isFinished ? (
                      <Check className="h-4 w-4 text-success inline" aria-label="Concluída" />
                    ) : (
                      <span className={m.remainingDays <= 2 ? "text-warning font-semibold" : ""}>{m.remainingDays}</span>
                    )}
                    {!m.hasStarted && !m.isFinished && m.daysToStart != null && (
                      <span className="block text-[10px] text-muted-foreground">começa em {m.daysToStart}d</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                    {float == null ? "—" : `${float}d`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        m.isOverdue
                          ? "text-[10px] bg-destructive/10 text-destructive border-destructive/30"
                          : a.status === "concluida"
                            ? "text-[10px] bg-success/15 text-success border-success/30"
                            : a.status === "em_andamento"
                              ? "text-[10px] bg-primary/10 text-primary border-primary/30"
                              : "text-[10px]"
                      }
                    >
                      {m.isOverdue ? "Atrasada" : STATUS_LABEL[a.status] ?? a.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CascadePreviewDialog
        open={pendingCascade.length > 0}
        onOpenChange={(open) => {
          if (!open) setPendingCascade([]);
        }}
        changes={pendingCascade}
        onConfirm={confirmCascade}
        isLoading={isSaving}
      />
    </div>
  );
}
