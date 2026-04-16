

## Plano: Expandir altura das colunas do Kanban de Roteiros

### Alteração

**`src/pages/ContentScripts.tsx`**

- Container flex das colunas (linha 94): adicionar `h-[calc(100vh-220px)]` para ocupar a altura disponível da página
- Cada coluna (linha 96): trocar `flex-shrink-0 w-56` → `flex-shrink-0 w-56 flex flex-col` para usar flex vertical
- Área droppable (linha 106): trocar `min-h-[200px]` → `flex-1` para preencher toda a altura restante da coluna

### O que NÃO muda
- Lógica, drag-and-drop, cards, rotas

