import { useMemo, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, User, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { addDays, startOfWeek, endOfWeek, format, differenceInDays, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths } from "date-fns";
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
}

interface GanttChartProps {
  tasks: GanttTask[];
  allTasks?: GanttTask[];
  onEdit?: (task: GanttTask) => void;
  viewMode: "day" | "week" | "month";
}

const ROW_HEIGHT = 36;

export function GanttChart({ tasks, allTasks, onEdit, viewMode }: GanttChartProps) {
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Build task index map for dependency arrows
  const taskIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    visibleTasks.forEach((t, i) => map.set(t.id, i));
    return map;
  }, [visibleTasks]);

  // All tasks lookup for dependencies that might not be visible
  const allTasksMap = useMemo(() => {
    const source = allTasks || tasks;
    const map = new Map<string, GanttTask>();
    source.forEach(t => map.set(t.id, t));
    return map;
  }, [allTasks, tasks]);

  const nav = (dir: -1 | 1) => setOffset(prev => prev + dir);
  const goToday = () => setOffset(0);

  const totalDays = days.length;
  const colWidth = viewMode === "month" ? "minmax(20px, 1fr)" : "minmax(40px, 1fr)";

  // Compute dependency arrows
  const arrows = useMemo(() => {
    const result: { fromX: number; fromY: number; toX: number; toY: number }[] = [];
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

        // Calculate pixel positions (approximate: 200px label + col proportional)
        // We'll use column fractions relative to the grid
        result.push({
          fromX: depEndCol + 1,
          fromY: depIdx,
          toX: taskStartCol,
          toY: taskIdx,
        });
      });
    });
    return result;
  }, [visibleTasks, taskIndexMap, allTasksMap, totalDays, rangeStart]);

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex items-center gap-2">
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
              const barColor = task.color || getDisciplineColor(task.discipline);

              return (
                <div key={task.id} className="grid border-b last:border-b-0 hover:bg-muted/20 group" style={{ gridTemplateColumns: `200px repeat(${totalDays}, ${colWidth})`, height: `${ROW_HEIGHT}px` }}>
                  {/* Task label */}
                  <div className="px-2 border-r flex items-center gap-1 min-w-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="truncate text-xs font-medium flex items-center gap-1 cursor-pointer" onClick={() => onEdit?.(task)}>
                            {task.requires_presence && <User className="h-3 w-3 text-warning shrink-0" />}
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: barColor }} />
                            <span className="truncate">{task.task_name}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{task.task_name}</p>
                          {task.supplier_name && <p className="text-xs text-muted-foreground">Resp: {task.supplier_name}</p>}
                          {task.discipline && <p className="text-xs text-muted-foreground">Disc: {task.discipline}</p>}
                          {task.environment && <p className="text-xs text-muted-foreground">Amb: {task.environment}</p>}
                          <p className="text-xs text-muted-foreground">Progresso: {task.progress_percentage ?? 0}%</p>
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
                              opacity: 0.8,
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
                </defs>
                {arrows.map((arrow, i) => {
                  // Convert column positions to percentages
                  const fromXPct = ((arrow.fromX) / totalDays) * 100;
                  const toXPct = ((arrow.toX) / totalDays) * 100;
                  const fromY = arrow.fromY * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const toY = arrow.toY * ROW_HEIGHT + ROW_HEIGHT / 2;

                  const midX = `${Math.min(fromXPct, toXPct) + Math.abs(toXPct - fromXPct) / 2}%`;

                  return (
                    <path
                      key={i}
                      d={`M ${fromXPct}% ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toXPct}% ${toY}`}
                      fill="none"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth="1.5"
                      opacity="0.5"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
