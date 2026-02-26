

## Mover "Tarefas de Voz" como submenu de "Tarefas"

### Alteração

**`src/components/layout/AppSidebar.tsx`**
- Remover item `{ title: "Tarefas de Voz", url: "/construction/voice-tasks" }` do grupo "Obra"
- Transformar item "Tarefas" em grupo colapsável com dois subitens:
  - "Tarefas por Obra" → `/construction/tasks`
  - "Histórico de Voz" → `/construction/voice-tasks`

Implementação usando `Collapsible` já disponível no projeto para criar o submenu aninhado dentro do item "Tarefas" no sidebar.

