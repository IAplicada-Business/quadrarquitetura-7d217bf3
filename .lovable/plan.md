

## Aumentar altura vertical das colunas do Pipeline Kanban

### Problema
As colunas do Kanban têm `min-h-[400px]` fixo (linha 233) e não expandem para ocupar toda a altura disponível da viewport. O container da página já usa `flex flex-col h-full` (linha 112) e o wrapper do Kanban usa `flex-1 min-h-0` (linha 224), mas o layout pai (`AppLayout`) envolve o conteúdo com padding que não propaga a altura corretamente.

### Solução

1. **`src/pages/LeadsPipeline.tsx`** — Linha 112: trocar `h-full` por `h-[calc(100vh-theme(spacing.32))]` (ou similar) para que o container da página ocupe a altura real disponível descontando header + padding. Remover o `min-h-[400px]` da coluna (linha 233) pois o `flex-1` já fará o trabalho quando o pai tiver altura definida.

2. **Alternativa mais limpa**: Na `div` raiz (linha 112), usar classes que garantam altura real:
   - Trocar `space-y-4 animate-fade-in flex flex-col h-full` por `space-y-4 animate-fade-in flex flex-col` e adicionar estilo `minHeight` calculado, ou usar `h-[calc(100vh-12rem)]` para descontar header (~4rem) + padding (~4rem) + métricas (~4rem).

### Arquivo editado
- `src/pages/LeadsPipeline.tsx` — ajustar altura do container principal e remover `min-h-[400px]` das colunas

