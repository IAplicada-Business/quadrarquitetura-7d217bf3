

# Painel de Notificacoes + Submenu Tarefas por Obra

## 1. Tabela `notifications` (nova migracao)

Criar tabela no banco para armazenar notificacoes do usuario:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info',        -- info, warning, success, error
  is_read BOOLEAN DEFAULT false,
  related_project_id UUID,
  related_entity_type TEXT,        -- lead, project, payment, task, etc.
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Policies: usuario so ve/cria/atualiza/deleta as proprias
```

Tipos de notificacao: `info`, `warning`, `success`, `error`.
Campos `related_*` permitem linkar a notificacao a um projeto, lead, pagamento, etc.

---

## 2. Painel de Notificacoes no Header

**Arquivo:** `src/hooks/useNotifications.ts` (novo)
- Hook com query para buscar notificacoes do usuario ordenadas por `created_at DESC`
- Mutations para: criar, marcar como lida, marcar todas como lidas, excluir

**Arquivo:** `src/components/layout/NotificationsPanel.tsx` (novo)
- Componente Popover que abre ao clicar no sino do header
- Lista de notificacoes com icone por tipo, titulo, mensagem e horario relativo
- Botao "Marcar todas como lidas"
- Botao para criar notificacao manual (abre dialog com form: titulo, mensagem, tipo)
- Cada notificacao tem botao de marcar como lida e excluir
- Badge mostra contagem de nao-lidas

**Arquivo:** `src/components/layout/AppHeader.tsx` (editar)
- Substituir o botao estatico do sino pelo componente `NotificationsPanel`
- Badge passa a mostrar contagem real de notificacoes nao-lidas

---

## 3. Submenu "Tarefas" em Obra + Pagina

**Arquivo:** `src/components/layout/AppSidebar.tsx` (editar)
- Adicionar `{ title: "Tarefas", url: "/construction/tasks" }` no grupo "Obra"

**Arquivo:** `src/pages/ConstructionTasks.tsx` (novo)
- Pagina que lista tarefas agrupadas por obra (projeto)
- Usa a tabela `schedule_tasks` existente (ja tem campos: task_name, status, start_date, end_date, project_id, etc.)
- Seletor de projeto no topo para filtrar tarefas
- Botao "Nova Tarefa" que abre o `ScheduleTaskForm` ja existente
- Tabela com colunas: Tarefa, Obra, Status, Inicio, Fim, Progresso
- Acoes: editar, excluir, marcar status
- Cards de metricas no topo: Total de Tarefas, Em Execucao, Atrasadas, Concluidas

**Arquivo:** `src/App.tsx` (editar)
- Adicionar rota `/construction/tasks` apontando para `ConstructionTasks`

---

## Resumo dos arquivos

| Arquivo | Acao |
|---|---|
| Migracao SQL (notifications) | Criar tabela + RLS |
| `src/hooks/useNotifications.ts` | Novo - hook CRUD notificacoes |
| `src/components/layout/NotificationsPanel.tsx` | Novo - popover do sino |
| `src/components/layout/AppHeader.tsx` | Editar - integrar NotificationsPanel |
| `src/pages/ConstructionTasks.tsx` | Novo - pagina de tarefas por obra |
| `src/components/layout/AppSidebar.tsx` | Editar - adicionar link Tarefas |
| `src/App.tsx` | Editar - adicionar rota |

