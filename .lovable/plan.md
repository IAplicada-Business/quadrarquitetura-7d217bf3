

## Correção: Tarefas de voz salvam em `schedule_tasks` + seleção de projeto funcional

### Problemas identificados

1. **Tarefas só vão para `voice_tasks`** — a página "Tarefas por Obra" lê de `schedule_tasks`, então as tarefas criadas por voz nunca aparecem lá.
2. **Select de projeto não funciona** — na screenshot o select mostra "teste" mas parece ser o projeto selecionado corretamente. O problema principal é o item 1.

### Alterações

**`src/components/layout/VoiceAgentDialog.tsx`**
- Após criar em `voice_tasks` via `createBatch`, inserir também em `schedule_tasks` para cada tarefa criada:
  - `task_name` = task.title
  - `payment_note` = task.description
  - `project_id` = resolvedProjectId
  - `user_id` = user.id
  - `status` = "planejado"
  - `discipline` = task.category (se aplicável)
- Invalidar query `["all_schedule_tasks"]` após inserção para atualizar a página de Tarefas por Obra
- Importar `useQueryClient` e invalidar ambas as queries

### Mapeamento de campos
```text
voice_tasks.title       → schedule_tasks.task_name
voice_tasks.description → schedule_tasks.payment_note
voice_tasks.category    → schedule_tasks.discipline
voice_tasks.status      → schedule_tasks.status ("planejado")
voice_tasks.project_id  → schedule_tasks.project_id
voice_tasks.user_id     → schedule_tasks.user_id
```

Mantém `voice_tasks` como histórico e adiciona `schedule_tasks` como tabela operacional.

