

## Banco de Dados — Campos schedule_tasks

### Situação atual

Todos os campos solicitados **já existem** na tabela `schedule_tasks`:
- `description` (text, nullable) 
- `environment` (text, nullable) 
- `estimated_days` (integer, nullable) 
- `dependencies` (uuid[], default '{}') 
- `materials` (jsonb, default '[]') 

O campo `status` é do tipo `text` sem constraint — qualquer valor é aceito no banco. Basta adicionar "Pendência" como opção nos formulários.

### Alterações necessárias

**Nenhuma migração de banco de dados.** Apenas atualizar os selects de status nos formulários:

1. **`ScheduleTaskForm.tsx`** — Adicionar `<SelectItem value="pendencia">Pendência</SelectItem>` ao select de status
2. **`ConstructionTaskForm.tsx`** — Adicionar a mesma opção de "Pendência" ao select de status (se existir select de status nesse form)

### Detalhes técnicos
- Sem migração SQL
- Arquivos editados: `ScheduleTaskForm.tsx`, `ConstructionTaskForm.tsx`

