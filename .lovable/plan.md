

## Plano: Pré-popular Orçamentos, Materiais e Cronograma a partir do Escopo

### 1. Migration — nova coluna em `schedule_tasks`
```sql
ALTER TABLE schedule_tasks
  ADD COLUMN IF NOT EXISTS source_activity_id uuid
    REFERENCES project_activities(id) ON DELETE SET NULL;
```

### 2. `src/components/projects/ProjectBudgetsTab.tsx`
Adicionar botão **"Importar do Escopo"** no topo da aba (ao lado de "Nova Cotação"):
- Ao clicar, busca `activities` (já carregado via `useProjectActivities`)
- Compara com `quotes` existentes por `services_description` para evitar duplicatas
- Abre modal de confirmação (Dialog) com lista das atividades a importar e contagem
- Ao confirmar, cria `budget_quotes` para cada atividade:
  - `services_description` = activity.name
  - `scope_item_id` = null (ou matched scope item se houver)
  - `value` = 0
  - `material_estimate` = activity.area_m2 ?? 0
  - `status` = "pendente"
- Toast: "X itens importados do escopo"

### 3. `src/components/projects/ProjectMaterialsTab.tsx`
Reorganizar a seção de botões:
- Mover **"Calcular por Atividades"** (`recalculateFromActivities`) para posição de destaque no topo da aba, ANTES dos cards de métricas
- Adicionar botão secundário **"Importar lista do escopo"** ao lado:
  - Busca `activities` e para cada uma verifica se já existe `material_tracking` com `activity_id`
  - Se não existir, cria:
    - `material_name` = "Material — " + activity.name
    - `discipline` = activity.discipline
    - `activity_id` = activity.id
    - `source` = "manual"
  - Toast: "X materiais importados do escopo"

### 4. `src/components/projects/ProjectScheduleTab.tsx`
Adicionar botão **"Gerar do Escopo"** no topo do Gantt:
- Busca `activities` com `start_date` ou `duration_days` preenchidos
- Abre modal de confirmação com contagem
- Para cada atividade, verifica se já existe `schedule_task` com `source_activity_id`
  - Se existir → atualiza datas/status
  - Se não → cria novo `schedule_task`:
    - `task_name` = activity.name
    - `start_date` / `end_date` = activity.start_date / activity.end_date
    - `status` = mapeamento de status da atividade
    - `discipline` = activity.discipline
    - `source_activity_id` = activity.id

### Arquivos alterados
1. Migration SQL (nova coluna `source_activity_id`)
2. `src/components/projects/ProjectBudgetsTab.tsx` — botão + modal de importação
3. `src/components/projects/ProjectMaterialsTab.tsx` — reorganizar botões + botão importar
4. `src/components/projects/ProjectScheduleTab.tsx` — botão + modal gerar do escopo

### O que NÃO muda
- Estrutura do Gantt
- Nenhuma outra aba ou rota
- Hooks existentes (useProjectActivities, useBudgetQuotes, etc.)

