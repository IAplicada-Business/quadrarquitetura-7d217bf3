import { useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, User, Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { addDays, startOfWeek, endOfWeek, format, differenceInDays, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getDisciplineColor } from "@/lib/disciplineColors";

interface GanttTask {
  id: string;
  task_name: string;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  discipline: string | null;
  supplier_name: string | null;
  progress_percentage: number | null;
  color: string | null;
  requires_presence: boolean | null;
  is_daily_detail: boolean | null;
  dependencies?: string[] | null;
  environment?: string | null;
  estimated_days?: number | null;
}

interface GanttChartProps {
  tasks: GanttTask[];
  allTasks?: GanttTask[];
  onEdit?: (task: GanttTask) => void;
  viewMode: "day" | "week" | "month";
}

const ROW_HEIGHT = 36;

// ─── CPM calculation ───
interface CpmResult {
  criticalIds: Set<string>;
  floatMap: Map<string, number>;
  totalCriticalDays: number;
  estimatedEndDate: Date | null;
  criticalCount: number;
  totalWithDeps: number;
}

function computeCpm(allTasks: GanttTask[]): CpmResult {
  const empty: CpmResult = { criticalIds: new Set(), floatMap: new Map(), totalCriticalDays: 0, estimatedEndDate: null, criticalCount: 0, totalWithDeps: 0 };

  // Only tasks with start_date and estimated_days participate
  const eligible = allTasks.filter(t => t.start_date && t.estimated_days && t.estimated_days > 0);
  if (eligible.length === 0) return empty;

  const taskMap = new Map<string, GanttTask>();
  eligible.forEach(t => taskMap.set(t.id, t));

  // Build dependents map
  const dependentsOf = new Map<string, string[]>();
  eligible.forEach(t => {
    t.dependencies?.forEach(depId => {
      if (taskMap.has(depId)) {
        const arr = dependentsOf.get(depId) || [];
        arr.push(t.id);
        dependentsOf.set(depId, arr);
      }
    });
  });

  // Forward pass: ES / EF (in day offsets from a reference)
  const refDate = new Date(Math.min(...eligible.map(t => new Date(t.start_date!).getTime())));
  const esMap = new Map<string, number>();
  const efMap = new Map<string, number>();

  const toDayOffset = (d: string) => differenceInDays(new Date(d), refDate);

  // Topological sort via Kahn's
  const inDegree = new Map<string, number>();
  eligible.forEach(t => {
    const deps = (t.dependencies || []).filter(d => taskMap.has(d));
    inDegree.set(t.id, deps.length);
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    topoOrder.push(id);
    (dependentsOf.get(id) || []).forEach(depId => {
      const newDeg = (inDegree.get(depId) || 1) - 1;
      inDegree.set(depId, newDeg);
      if (newDeg === 0) queue.push(depId);
    });
  }

  // If cycle detected, include remaining tasks at end
  eligible.forEach(t => { if (!topoOrder.includes(t.id)) topoOrder.push(t.id); });

  // Forward
  topoOrder.forEach(id => {
    const task = taskMap.get(id)!;
    const deps = (task.dependencies || []).filter(d => taskMap.has(d));
    let es = toDayOffset(task.start_date!);
    if (deps.length > 0) {
      es = Math.max(es, ...deps.map(d => efMap.get(d) ?? 0));
    }
    esMap.set(id, es);
    efMap.set(id, es + (task.estimated_days || 0));
  });

  // Project end = max EF
  const projectEnd = Math.max(...Array.from(efMap.values()));

  // Backward
  const lfMap = new Map<string, number>();
  const lsMap = new Map<string, number>();

  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i];
    const task = taskMap.get(id)!;
    const deps = dependentsOf.get(id) || [];
    let lf = projectEnd;
    if (deps.length > 0) {
      lf = Math.min(...deps.map(d => lsMap.get(d) ?? projectEnd));
    }
    lfMap.set(id, lf);
    lsMap.set(id, lf - (task.estimated_days || 0));
  }

  // Float & critical
  const floatMap = new Map<string, number>();
  const criticalIds = new Set<string>();
  topoOrder.forEach(id => {
    const f = (lsMap.get(id) ?? 0) - (esMap.get(id) ?? 0);
    floatMap.set(id, f);
    if (f === 0) criticalIds.add(id);
  });

  // Total critical days = sum of estimated_days of critical tasks (but actually it's the longest path = projectEnd - min ES of critical roots)
  const totalCriticalDays = projectEnd - Math.min(...Array.from(criticalIds).map(id => esMap.get(id) ?? 0));

  const estimatedEndDate = addDays(refDate, projectEnd);

  return {
    criticalIds,
    floatMap,
    totalCriticalDays,
    estimatedEndDate,
    criticalCount: criticalIds.size,
    totalWithDeps: eligible.length,
  };
}

export function GanttChart({ tasks, allTasks, onEdit, viewMode }: GanttChartProps) {
  const [offset, setOffset] = useState(0);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get full dependency chain (all dependents recursively)
  const getDependencyChain = useMemo(() => {
    const allSource = allTasks || tasks;
    return (taskId: string): Set<string> => {
      const chain = new Set<string>();
      function traverse(id: string) {
        const dependents = allSource.filter(a => a.dependencies?.includes(id));
        for (const dep of dependents) {
          if (!chain.has(dep.id)) {
            chain.add(dep.id);
            traverse(dep.id);
          }
        }
      }
      traverse(taskId);
      return chain;
    };
  }, [allTasks, tasks]);

  const hoveredChain = useMemo(() => {
    if (!hoveredTaskId) return null;
    return getDependencyChain(hoveredTaskId);
  }, [hoveredTaskId, getDependencyChain]);

  const { rangeStart, rangeEnd, days } = useMemo(() => {
    const today = new Date();
    let start: Date, end: Date;
    if (viewMode === "day") {
      const base = addDays(today, offset * 14);
      start = addDays(base, -7);
      end = addDays(base, 6);
    } else if (viewMode === "week") {
      const base = addWeeks(today, offset);
      start = startOfWeek(base, { weekStartsOn: 1 });
      end = endOfWeek(base, { weekStartsOn: 1 });
    } else {
      const base = addMonths(today, offset);
      start = startOfMonth(base);
      end = endOfMonth(base);
    }
    const numDays = differenceInDays(end, start) + 1;
    const dayList = Array.from({ length: numDays }, (_, i) => addDays(start, i));
    return { rangeStart: start, rangeEnd: end, days: dayList };
  }, [offset, viewMode]);

  const visibleTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.start_date) return false;
      const s = new Date(t.start_date);
      const e = t.end_date ? new Date(t.end_date) : s;
      return s <= rangeEnd && e >= rangeStart;
    });
  }, [tasks, rangeStart, rangeEnd]);

  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    visibleTasks.forEach((t, i) => map.set(t.id, i));
    return map;
  }, [visibleTasks]);

  const allTasksSource = allTasks || tasks;
  const allTasksMap = useMemo(() => {
    const map = new Map<string, GanttTask>();
    allTasksSource.forEach(t => map.set(t.id, t));
    return map;
  }, [allTasksSource]);

  // CPM
  const cpm = useMemo(() => computeCpm(allTasksSource), [allTasksSource]);

  const nav = (dir: -1 | 1) => setOffset(prev => prev + dir);
  const goToday = () => setOffset(0);

  const totalDays = days.length;
  const colWidth = viewMode === "month" ? "minmax(20px, 1fr)" : "minmax(40px, 1fr)";

  // Dependency arrows
  const arrows = useMemo(() => {
    const result: { fromX: number; fromY: number; toX: number; toY: number; isCritical: boolean }[] = [];
    visibleTasks.forEach((task, taskIdx) => {
      if (!task.dependencies?.length) return;
      task.dependencies.forEach(depId => {
        const depIdx = taskIndexMap.get(depId);
        if (depIdx === undefined) return;
        const depTask = allTasksMap.get(depId);
        if (!depTask?.end_date || !task.start_date) return;

        const depEnd = new Date(depTask.end_date);
        const taskStart = new Date(task.start_date);
        const depEndCol = Math.min(totalDays - 1, Math.max(0, differenceInDays(depEnd, rangeStart)));
        const taskStartCol = Math.max(0, differenceInDays(taskStart, rangeStart));

        const isCritical = cpm.criticalIds.has(task.id) && cpm.criticalIds.has(depId);

        result.push({ fromX: depEndCol + 1, fromY: depIdx, toX: taskStartCol, toY: taskIdx, isCritical });
      });
    });
    return result;
  }, [visibleTasks, taskIndexMap, allTasksMap, totalDays, rangeStart, cpm.criticalIds]);

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => nav(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={goToday}>Hoje</Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => nav(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-display">
          {format(rangeStart, "dd MMM", { locale: ptBR })} — {format(rangeEnd, "dd MMM yyyy", { locale: ptBR })}
        </span>

        <div className="ml-auto flex items-center gap-3">
          {/* Legend */}
          {showCriticalPath && cpm.criticalCount > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm border-2 border-destructive bg-destructive/20" /> Caminho crítico</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-muted border border-border" /> Com folga</span>
            </div>
          )}
          {/* Toggle */}
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <Switch checked={showCriticalPath} onCheckedChange={setShowCriticalPath} className="scale-75" />
            Caminho crítico
          </label>
        </div>
      </div>

      {/* Gantt */}
      <div className="border rounded-lg overflow-x-auto relative" ref={containerRef}>
        {/* Day headers */}
        <div className="grid border-b bg-muted/30" style={{ gridTemplateColumns: `200px repeat(${totalDays}, ${colWidth})` }}>
          <div className="p-2 text-xs font-medium text-muted-foreground border-r">Etapa</div>
          {days.map((day, i) => {
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div key={i} className={`p-1 text-center text-[10px] border-r last:border-r-0 ${isToday ? "bg-primary/10 font-bold" : isWeekend ? "bg-muted/50" : ""}`}>
                <div>{format(day, "EEE", { locale: ptBR })}</div>
                <div className="font-medium">{format(day, "dd")}</div>
              </div>
            );
          })}
        </div>

        {/* Task rows */}
        {visibleTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhuma tarefa neste período.
          </div>
        ) : (
          <div className="relative">
            {visibleTasks.map((task, rowIdx) => {
              const taskStart = new Date(task.start_date!);
              const taskEnd = task.end_date ? new Date(task.end_date) : taskStart;
              const startCol = Math.max(0, differenceInDays(taskStart, rangeStart));
              const endCol = Math.min(totalDays - 1, differenceInDays(taskEnd, rangeStart));
              const baseBarColor = task.color || getDisciplineColor(task.discipline);
              const isCritical = showCriticalPath && cpm.criticalIds.has(task.id);
              const taskFloat = cpm.floatMap.get(task.id);

              // Deadline alerts
              const finishedStatuses = ["concluido", "executado"];
              const isFinished = finishedStatuses.includes(task.status || "");
              const nowDate = new Date();
              const hasEndDate = !!task.end_date;
              const taskEndDate = hasEndDate ? new Date(task.end_date!) : null;
              const isOverdue = hasEndDate && !isFinished && isBefore(taskEndDate!, new Date(format(nowDate, "yyyy-MM-dd")));
              const isExpiringSoon = hasEndDate && !isFinished && !isOverdue && isBefore(taskEndDate!, addDays(nowDate, 4)) && !isBefore(taskEndDate!, new Date(format(nowDate, "yyyy-MM-dd")));
              const daysUntilDeadline = hasEndDate ? differenceInDays(taskEndDate!, new Date(format(nowDate, "yyyy-MM-dd"))) : null;
              const barColor = isOverdue ? "#DC2626" : isExpiringSoon ? "#D97706" : baseBarColor;
              const barOpacity = isOverdue ? 0.85 : isCritical ? 1 : 0.8;
              const isHovered = hoveredTaskId === task.id;
              const isInChain = hoveredChain?.has(task.id) ?? false;
              const dimmed = hoveredTaskId !== null && !isHovered && !isInChain;
              const chainHighlight = isInChain && !isHovered;

              return (
                <div
                  key={task.id}
                  className="grid border-b last:border-b-0 hover:bg-muted/20 group transition-opacity duration-150"
                  style={{
                    gridTemplateColumns: `200px repeat(${totalDays}, ${colWidth})`,
                    height: `${ROW_HEIGHT}px`,
                    opacity: dimmed ? 0.3 : 1,
                  }}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  {/* Task label */}
                  <div className="px-2 border-r flex items-center gap-1 min-w-0">
                    <TooltipProvider>
                      <Tooltip>
                    <TooltipTrigger asChild>
                          <div className="flex flex-col justify-center cursor-pointer min-w-0 overflow-hidden" onClick={() => onEdit?.(task)}>
                            <div className="truncate text-xs font-medium flex items-center gap-1">
                              {task.requires_presence && <User className="h-3 w-3 text-warning shrink-0" />}
                              {(isOverdue || isExpiringSoon) && (
                                <AlertTriangle className="h-3 w-3 shrink-0" style={{ color: isOverdue ? "#DC2626" : "#D97706" }} />
                              )}
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: barColor }} />
                              <span className="truncate">{task.task_name}</span>
                            </div>
                            {task.discipline && (
                              <span className="text-[10px] text-muted-foreground truncate pl-3">{task.discipline}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs font-semibold">{task.task_name}</p>
                          {task.discipline && <p className="text-xs text-muted-foreground">Disc: {task.discipline}</p>}
                          {task.supplier_name && <p className="text-xs text-muted-foreground">Resp: {task.supplier_name}</p>}
                          {task.environment && <p className="text-xs text-muted-foreground">Amb: {task.environment}</p>}
                          <p className="text-xs text-muted-foreground">Progresso: {task.progress_percentage ?? 0}%</p>
                          {task.start_date && <p className="text-xs text-muted-foreground">Prazo: {format(new Date(task.start_date), "dd/MM")} — {task.end_date ? format(new Date(task.end_date), "dd/MM/yyyy") : "—"}</p>}
                          {isOverdue && daysUntilDeadline !== null && (
                            <p className="text-xs font-medium" style={{ color: "#DC2626" }}>Atrasada {Math.abs(daysUntilDeadline)} dia{Math.abs(daysUntilDeadline) !== 1 ? "s" : ""}</p>
                          )}
                          {isExpiringSoon && daysUntilDeadline !== null && (
                            <p className="text-xs font-medium" style={{ color: "#D97706" }}>Vence em {daysUntilDeadline} dia{daysUntilDeadline !== 1 ? "s" : ""}</p>
                          )}
                          {taskFloat !== undefined && (
                            <p className="text-xs text-muted-foreground">Folga: {taskFloat} dia{taskFloat !== 1 ? "s" : ""}</p>
                          )}
                          <p className={`text-xs font-medium ${isCritical ? "text-destructive" : "text-muted-foreground"}`}>
                            Caminho crítico: {cpm.criticalIds.has(task.id) ? "Sim" : "Não"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {onEdit && (
                      <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0" onClick={() => onEdit(task)}>
                        <Pencil className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                  {/* Day cells with bar */}
                  {days.map((day, i) => {
                    const isInRange = i >= startCol && i <= endCol;
                    const isStart = i === startCol;
                    const isEnd = i === endCol;
                    const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <div key={i} className={`relative border-r last:border-r-0 ${isToday ? "bg-primary/5" : isWeekend ? "bg-muted/30" : ""}`}>
                        {isInRange && (
                          <div
                            className="absolute top-1 bottom-1 flex items-center cursor-pointer"
                            onClick={() => onEdit?.(task)}
                            style={{
                              left: isStart ? "2px" : 0,
                              right: isEnd ? "2px" : 0,
                              backgroundColor: barColor,
                              borderRadius: `${isStart ? "4px" : "0"} ${isEnd ? "4px" : "0"} ${isEnd ? "4px" : "0"} ${isStart ? "4px" : "0"}`,
                              opacity: barOpacity,
                              border: chainHighlight ? "2px solid hsl(var(--primary))" : isCritical ? "2.5px solid hsl(var(--destructive))" : "none",
                              boxSizing: "border-box",
                            }}
                          >
                            {isStart && (endCol - startCol) >= 2 && (
                              <span className="text-[9px] text-white px-1 truncate font-medium">
                                {task.task_name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* SVG overlay for dependency arrows */}
            {arrows.length > 0 && (
              <svg
                className="absolute top-0 left-[200px] pointer-events-none"
                style={{ width: `calc(100% - 200px)`, height: `${visibleTasks.length * ROW_HEIGHT}px` }}
              >
                <defs>
                  <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="hsl(var(--muted-foreground))" opacity="0.6" />
                  </marker>
                  <marker id="arrowhead-critical" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="hsl(var(--destructive))" opacity="0.9" />
                  </marker>
                </defs>
                {arrows.map((arrow, i) => {
                  const fromXPct = ((arrow.fromX) / totalDays) * 100;
                  const toXPct = ((arrow.toX) / totalDays) * 100;
                  const fromY = arrow.fromY * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const toY = arrow.toY * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const midX = `${Math.min(fromXPct, toXPct) + Math.abs(toXPct - fromXPct) / 2}%`;
                  const critical = showCriticalPath && arrow.isCritical;

                  return (
                    <path
                      key={i}
                      d={`M ${fromXPct}% ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toXPct}% ${toY}`}
                      fill="none"
                      stroke={critical ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
                      strokeWidth={critical ? "2.5" : "1.5"}
                      opacity={critical ? "0.9" : "0.5"}
                      markerEnd={critical ? "url(#arrowhead-critical)" : "url(#arrowhead)"}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Critical Path Summary Card */}
      {showCriticalPath && cpm.criticalCount > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Duração do caminho crítico</p>
                <p className="font-bold text-display text-lg">{cpm.totalCriticalDays} dias</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Conclusão estimada</p>
                <p className="font-bold text-display text-lg">
                  {cpm.estimatedEndDate ? format(cpm.estimatedEndDate, "dd/MM/yyyy") : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Atividades no caminho crítico</p>
                <p className="font-bold text-display text-lg">
                  <span className="text-destructive">{cpm.criticalCount}</span>
                  <span className="text-muted-foreground text-sm font-normal"> / {cpm.totalWithDeps} elegíveis</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
