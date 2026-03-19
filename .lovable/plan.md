

## Reestruturar Tabela de Tarefas por Obra

### 1. Atualizar colunas da tabela

Novas colunas (nesta ordem): Atividade | Ambiente | Disciplina | Responsável | Depende de | Status | Início | Fim | Prazo (dias) | Progresso | Ações

A coluna "Depende de" mostra os nomes das tarefas dependentes (lookup pelo array `dependencies`). A coluna "Prazo (dias)" mostra `estimated_days`. Remover coluna "Obra" (já filtrada).

### 2. Filtros múltiplos (acima da tabela)

Adicionar filtros usando multi-select com Popover + Checkboxes (sem dependência externa):
- **Por Obra** — manter Select existente
- **Por Disciplina** — multi-select, opções extraídas das tarefas carregadas
- **Por Status** — multi-select com as 5 opções de status
- **Por Responsável** — multi-select, opções extraídas dos `supplier_name` (split por vírgula)
- **Por Ambiente** — multi-select, opções extraídas dos `environment` das tarefas

Cada filtro: botão com badge mostrando count de seleções. Popover com lista de checkboxes.

### 3. Toggle de agrupamento

Botão toggle "Ver por lista" / "Agrupar por disciplina":
- **Lista** (padrão): todas atividades em sequência plana (com subtarefas expandíveis)
- **Agrupar por disciplina**: agrupar visualmente com header de seção por disciplina, atividades independentes dentro de cada grupo

### 4. Toggle "Ver pendências"

Botão/toggle que filtra:
- Status = "pendencia" OU (progresso < 100% E data fim < hoje)
- Funciona como checklist de final de obra
- Cada linha ganha um **checkbox** rápido que marca status = "executado" e progresso = 100% sem abrir formulário (mutation inline)

### 5. Métricas ajustadas

Contar **TODAS** as atividades (incluindo subtarefas), não apenas tarefas-pai:
- Total: `tasks.length`
- Em Execução: `status === "em_execucao"`
- Atrasadas: `end_date < hoje E status !== "executado"`
- Pendências: `status === "pendencia"`
- Concluídas: `status === "executado"`

### Detalhes técnicos

- Criar componente helper `MultiSelectFilter` (Popover + Checkboxes) reutilizável para os 4 filtros novos
- Estado: `filterDisciplines: string[]`, `filterStatuses: string[]`, `filterResponsibles: string[]`, `filterEnvironments: string[]`, `groupByDiscipline: boolean`, `showPendencias: boolean`
- Filtrar `tasks` por todos os filtros ativos antes de separar em parentTasks/subtasks
- Quick-complete checkbox usa `updateTask.mutate({ id, status: "executado", progress_percentage: 100 })`
- Nenhuma migração necessária — todos os dados já existem no schema atual
- Nenhuma rota, aba ou navegação será removida

