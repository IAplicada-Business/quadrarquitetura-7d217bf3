// Caminho crítico (CPM) do cronograma. Extraído do GanttChart para o
// Cronograma Reverso usar exatamente o mesmo cálculo: uma atividade é
// "marco crítico" quando não tem folga — qualquer atraso nela atrasa o
// fim da obra.
//
// Só entram atividades com data de início e duração > 0. Dependências
// que apontam para atividades fora desse conjunto são ignoradas.

import { addDays, differenceInDays } from "date-fns";

export interface CpmTask {
  id: string;
  start_date: string | null;
  /** Duração em dias (mesma unidade do Gantt: duration_days / estimated_days). */
  duration: number | null | undefined;
  dependencies?: string[] | null;
}

export interface CpmResult {
  criticalIds: Set<string>;
  floatMap: Map<string, number>;
  totalCriticalDays: number;
  estimatedEndDate: Date | null;
  criticalCount: number;
  totalWithDeps: number;
}

export const EMPTY_CPM: CpmResult = {
  criticalIds: new Set(),
  floatMap: new Map(),
  totalCriticalDays: 0,
  estimatedEndDate: null,
  criticalCount: 0,
  totalWithDeps: 0,
};

export function computeCriticalPath(allTasks: CpmTask[]): CpmResult {
  const eligible = allTasks.filter((t) => t.start_date && t.duration && t.duration > 0);
  if (eligible.length === 0) return EMPTY_CPM;

  const taskMap = new Map<string, CpmTask>();
  eligible.forEach((t) => taskMap.set(t.id, t));

  const dependentsOf = new Map<string, string[]>();
  eligible.forEach((t) => {
    t.dependencies?.forEach((depId) => {
      if (taskMap.has(depId)) {
        const arr = dependentsOf.get(depId) || [];
        arr.push(t.id);
        dependentsOf.set(depId, arr);
      }
    });
  });

  const refDate = new Date(Math.min(...eligible.map((t) => new Date(t.start_date!).getTime())));
  const esMap = new Map<string, number>();
  const efMap = new Map<string, number>();
  const toDayOffset = (d: string) => differenceInDays(new Date(d), refDate);

  const inDegree = new Map<string, number>();
  eligible.forEach((t) => {
    const deps = (t.dependencies || []).filter((d) => taskMap.has(d));
    inDegree.set(t.id, deps.length);
  });
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });
  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    topoOrder.push(id);
    (dependentsOf.get(id) || []).forEach((depId) => {
      const newDeg = (inDegree.get(depId) || 1) - 1;
      inDegree.set(depId, newDeg);
      if (newDeg === 0) queue.push(depId);
    });
  }
  eligible.forEach((t) => {
    if (!topoOrder.includes(t.id)) topoOrder.push(t.id);
  });

  topoOrder.forEach((id) => {
    const task = taskMap.get(id)!;
    const deps = (task.dependencies || []).filter((d) => taskMap.has(d));
    let es = toDayOffset(task.start_date!);
    if (deps.length > 0) es = Math.max(es, ...deps.map((d) => efMap.get(d) ?? 0));
    esMap.set(id, es);
    efMap.set(id, es + (task.duration || 0));
  });

  const projectEnd = Math.max(...Array.from(efMap.values()));
  const lfMap = new Map<string, number>();
  const lsMap = new Map<string, number>();
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const id = topoOrder[i];
    const task = taskMap.get(id)!;
    const deps = dependentsOf.get(id) || [];
    let lf = projectEnd;
    if (deps.length > 0) lf = Math.min(...deps.map((d) => lsMap.get(d) ?? projectEnd));
    lfMap.set(id, lf);
    lsMap.set(id, lf - (task.duration || 0));
  }

  const floatMap = new Map<string, number>();
  const criticalIds = new Set<string>();
  topoOrder.forEach((id) => {
    const f = (lsMap.get(id) ?? 0) - (esMap.get(id) ?? 0);
    floatMap.set(id, f);
    if (f === 0) criticalIds.add(id);
  });

  const totalCriticalDays = projectEnd - Math.min(...Array.from(criticalIds).map((id) => esMap.get(id) ?? 0));
  return {
    criticalIds,
    floatMap,
    totalCriticalDays,
    estimatedEndDate: addDays(refDate, projectEnd),
    criticalCount: criticalIds.size,
    totalWithDeps: eligible.length,
  };
}
