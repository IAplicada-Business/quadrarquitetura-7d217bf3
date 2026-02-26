

## Adicionar "Agenda" como submenu em Tarefas

### Alterações

**1. Criar `src/pages/ConstructionAgenda.tsx`**
- Página de agenda/calendário que consolida todas as tarefas (`schedule_tasks`), visitas (`site_visits`) e reuniões por data
- Visualização em lista agrupada por data (hoje, próximos dias, semana)
- Cada item mostra tipo (tarefa/visita), nome, projeto, status e data prazo
- Filtro por projeto e por tipo de evento

**2. Atualizar `src/components/layout/AppSidebar.tsx`**
- Adicionar "Agenda" como terceiro subitem em Tarefas:
  - "Tarefas por Obra" → `/construction/tasks`
  - "Histórico de Voz" → `/construction/voice-tasks`
  - **"Agenda"** → `/construction/agenda`

**3. Atualizar `src/App.tsx`**
- Adicionar rota `/construction/agenda` apontando para `ConstructionAgenda`

