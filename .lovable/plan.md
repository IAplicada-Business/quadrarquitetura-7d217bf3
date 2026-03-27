

## Alertas de prazo vencido no Gantt + KPI no Dashboard

### Visão geral

Implementar alertas visuais para tarefas atrasadas/próximas do vencimento no Gantt, painel colapsável de pendências abaixo do Gantt, e KPI card no Dashboard Escritório.

### 1. GanttChart.tsx — Alertas visuais nas barras

Adicionar lógica de deadline status para cada tarefa:
- `end_date < hoje` e `status !== 'concluido' && status !== 'executado'` → barra vermelha `#DC2626` opacity 0.85
- `end_date` entre hoje e +3 dias, mesmo filtro → barra amarela `#D97706`
- Ícone `AlertTriangle` (lucide) ao lado do nome da tarefa nessas situações
- Tooltip extra no hover: "Atrasada X dias" ou "Vence em X dias"

A cor de deadline sobrescreve a cor de disciplina/custom quando aplicável. A borda de caminho crítico continua sendo aplicada por cima.

### 2. ProjectScheduleTab.tsx — Painel colapsável "Pendências e Atrasos"

Abaixo do `<GanttChart />`, adicionar seção usando `<Collapsible>`:
- Título: "Pendências e Atrasos" com badge de contagem
- Lista de tarefas atrasadas + próximas do vencimento, ordenadas por atraso decrescente
- Cada item: nome, responsável (`supplier_name`), data prevista, dias de atraso (vermelho) ou dias restantes (amarelo)
- Calcular a partir dos `items` já carregados pelo hook — sem query adicional

### 3. DashboardEscritorio.tsx — KPI card "Tarefas Atrasadas"

- Nova query `['schedule_tasks', 'overdue']` buscando `schedule_tasks` com `end_date < hoje` e `status` diferente de `concluido`/`executado`, join com `projects` para filtrar apenas projetos ativos
- Card KPI com contagem, ícone `AlertTriangle`, cor vermelha
- Click navega para `/projects` (sem filtro custom por agora, pois a rota não suporta query params de filtro)

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/projects/GanttChart.tsx` | Adicionar lógica de deadline color override, ícone alerta, tooltip "Atrasada/Vence em X dias" |
| `src/components/projects/ProjectScheduleTab.tsx` | Adicionar painel colapsável "Pendências e Atrasos" abaixo do Gantt |
| `src/pages/DashboardEscritorio.tsx` | Adicionar query de tarefas atrasadas + KPI card com navegação |

### Detalhes técnicos

- Deadline check: `differenceInDays(today, new Date(task.end_date))` para dias de atraso; positivo = atrasado, negativo = dias restantes
- Status excluídos: `concluido` e `executado` (ambos representam tarefas finalizadas no sistema)
- Não altera estrutura do Gantt, apenas sobrescreve `barColor` e adiciona ícone/tooltip condicionalmente
- Usa `Collapsible` de radix já existente no projeto
- Query do dashboard usa `supabase.from("schedule_tasks").select("id, end_date, status, task_name, project_id, projects(name, status)")` com filtro `.lt("end_date", todayStr).not("status", "in", "(concluido,executado)")`

