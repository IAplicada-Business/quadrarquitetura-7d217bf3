

## Refatoração: Escopo e Cronograma centrados em Atividades

### Visão geral

Criar tabela `project_activities` no banco, novo hook `useProjectActivities`, substituir a aba Escopo por um Kanban de atividades, e fazer o Gantt ler de `project_activities` (com fallback para `schedule_tasks` em projetos antigos). Todas as outras abas permanecem intactas.

---

### 1. Migration — Criar tabela `project_activities`

```sql
CREATE TABLE project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  area_m2 numeric,
  duration_days integer,
  start_date date,
  end_date date,
  status text DEFAULT 'pendente',
  progress_percent integer DEFAULT 0,
  depends_on uuid[] DEFAULT '{}',
  discipline text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view project_activities" ON project_activities
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create project_activities" ON project_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update project_activities" ON project_activities
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete project_activities" ON project_activities
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
```

Usar validation trigger em vez de CHECK constraints para `status` e `progress_percent`:

```sql
CREATE OR REPLACE FUNCTION validate_project_activity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pendente','em_andamento','concluida','bloqueada') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;
  IF NEW.progress_percent < 0 OR NEW.progress_percent > 100 THEN
    RAISE EXCEPTION 'Progresso deve ser entre 0 e 100';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_activity
  BEFORE INSERT OR UPDATE ON project_activities
  FOR EACH ROW EXECUTE FUNCTION validate_project_activity();
```

---

### 2. Novo hook — `src/hooks/useProjectActivities.ts`

CRUD padrão com react-query, padrão idêntico ao `useScopeItems`:
- `queryKey: ["project_activities", projectId]`
- Ordenar por `position`, `created_at`
- Mutations: create, update, remove, reorder (batch update de position)

---

### 3. Reestruturar aba Escopo — `src/components/projects/ProjectScopeTab.tsx`

Substituir a tabela de disciplinas por um **Kanban de 4 colunas**:

| Pendente | Em Andamento | Concluída | Bloqueada |

Cada card mostra:
- Nome da atividade (título)
- Badge de disciplina (tag pequena colorida)
- Área m² e duração (texto pequeno)
- Barra de progresso (`<Progress>`)
- Ícone de link se tem dependências

**Botões no topo:**
- "Nova Atividade" → modal com campos: nome, descrição, área m², duração (dias), data início, disciplina (input livre), dependências (multiselect)
- "Gerar com IA" → placeholder (modal vazio com mensagem "Em breve")

**Drag-and-drop** entre colunas usando HTML5 API nativa (mesmo padrão já usado no LeadsPipeline):
- `onDragStart` → guarda `activity.id`
- `onDrop` na coluna → muta `status` da atividade

Novo componente: `ActivityForm.tsx` (modal Dialog com os campos)

---

### 4. Reestruturar aba Cronograma — `src/components/projects/ProjectScheduleTab.tsx`

Lógica dual:
1. Carregar `project_activities` via `useProjectActivities`
2. Carregar `schedule_tasks` via `useScheduleTasks` (existente)
3. Se `project_activities` tem itens → usar como fonte do Gantt
4. Senão → usar `schedule_tasks` (compatibilidade projetos antigos)

Mapear `project_activities` para o formato `GanttTask`:
```typescript
activities.map(a => ({
  id: a.id,
  task_name: a.name,
  start_date: a.start_date,
  end_date: a.end_date,
  status: mapActivityStatus(a.status), // pendente→planejado, em_andamento→em_execucao, etc.
  discipline: a.discipline,
  progress_percentage: a.progress_percent,
  color: statusColorMap[a.status], // cinza/azul/verde/vermelho
  ...
}))
```

Cores por status:
- `pendente` → `#9CA3AF` (cinza)
- `em_andamento` → `#1B2A4A` (azul escuro)
- `concluida` → `#16A34A` (verde)
- `bloqueada` → `#DC2626` (vermelho)

Manter todas as sub-abas existentes (Gantt, Lista, Visão Cliente, Pendências). Os botões "Nova Etapa" e "Importar do Escopo" continuam funcionando para `schedule_tasks`.

---

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar `project_activities` + RLS + trigger |
| `src/hooks/useProjectActivities.ts` | **Novo** — CRUD hook |
| `src/components/projects/ActivityForm.tsx` | **Novo** — Modal de criação/edição |
| `src/components/projects/ProjectScopeTab.tsx` | **Reescrever** — Kanban de atividades |
| `src/components/projects/ProjectScheduleTab.tsx` | **Editar** — Lógica dual activities/tasks |

### Não alterados

Resumo, Cotações, Orçamentos, Materiais, Prestação de Contas, Documentos, Acompanhamento, `schedule_tasks`, `scope_items`, `GanttChart.tsx`.

