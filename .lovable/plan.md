

## Adicionar Subtarefas em Tarefas por Obra

### 1. Migração de banco de dados
Adicionar coluna `parent_id` (uuid, nullable, self-referencing FK) na tabela `schedule_tasks` para suportar hierarquia de subtarefas.

```sql
ALTER TABLE schedule_tasks ADD COLUMN parent_id uuid REFERENCES schedule_tasks(id) ON DELETE CASCADE;
```

### 2. Atualizar `src/pages/ConstructionTasks.tsx`
- Separar tarefas em **tarefas-pai** (`parent_id IS NULL`) e **subtarefas** agrupadas por `parent_id`
- Adicionar linha expandível para cada tarefa-pai com toggle (chevron) para mostrar/esconder subtarefas
- Botao "+" inline na linha da tarefa para adicionar subtarefa (abre o form com `parent_id` preenchido e `project_id` herdado)
- Subtarefas renderizadas com indentacao visual abaixo da tarefa-pai
- Métricas contam apenas tarefas-pai (ou todas, conforme fizer sentido)

### 3. Atualizar `src/components/construction/ConstructionTaskForm.tsx`
- Aceitar prop `parentTask` opcional (quando criando subtarefa)
- Quando `parentTask` fornecido: herdar `project_id` (readonly), ocultar seleção de projeto, titulo "Nova Subtarefa"
- Submeter `parent_id` junto com os dados

### 4. Atualizar mutations em `ConstructionTasks.tsx`
- Incluir `parent_id` no insert quando criando subtarefa
- Ao deletar tarefa-pai, subtarefas são removidas automaticamente (CASCADE)

