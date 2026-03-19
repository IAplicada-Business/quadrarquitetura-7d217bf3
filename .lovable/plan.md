

## Caminho Crítico no Gantt — Plano de Implementação

### Contexto
Adicionar cálculo e visualização do caminho crítico (CPM) ao GanttChart existente. Sem alterações de banco, rotas ou abas.

### Alterações

**1. Editar `src/components/projects/GanttChart.tsx`**

- Add `estimated_days` to `GanttTask` interface
- New `useMemo` implementing simplified CPM:
  - Build adjacency (dependencies → dependents)
  - Forward pass: ES/EF for each task (ES = max EF of deps, EF = ES + estimated_days; fallback to actual start/end dates if no estimated_days)
  - Backward pass: LF/LS (LF = min LS of dependents, LS = LF - estimated_days)
  - Float = LS - ES; critical if float === 0
  - Returns `Set<string>` of critical task IDs + summary stats (total critical days, estimated end date, count)
- New state: `showCriticalPath` toggle (default: true)
- UI additions:
  - Toggle switch + legend in navigation bar: "Destacar caminho crítico" + "🔴 Caminho crítico" / "⚪ Com folga"
  - When enabled: critical task bars get red border (3px, `border: 3px solid #ef4444`), non-critical bars unchanged
  - Critical dependency arrows: red stroke instead of muted
  - Enhanced tooltip: add "Folga: X dias" and "Caminho crítico: Sim/Não"
  - Summary card below the Gantt grid: critical path duration, estimated completion date, critical vs total count

**2. Editar `src/components/projects/ProjectScheduleTab.tsx`**

- Add `estimated_days` to the ganttTasks and allGanttTasks mapping (field already exists on schedule_tasks)

### CPM Logic (pseudocode)

```text
For each task without dependencies: ES = task.start_date, EF = ES + estimated_days
Forward pass (topological): ES = max(EF of all deps), EF = ES + estimated_days
Backward pass (reverse): LF = min(LS of all dependents), LS = LF - estimated_days
Float = LS - ES
Critical = float === 0
```

Tasks without `estimated_days` or `start_date` are excluded from CPM calculation.

### Arquivos editados
- `GanttChart.tsx` — CPM logic, toggle, legend, styled bars/arrows, tooltip, summary card
- `ProjectScheduleTab.tsx` — pass `estimated_days` in task mapping

