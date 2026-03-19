

## Invalidação do cache de budget_quotes no ProjectScopeTab

### Alteração

**`src/components/projects/ProjectScopeTab.tsx`**
- Adicionar `import { useQueryClient } from "@tanstack/react-query"` nos imports (linha 1)
- Dentro do componente, declarar `const queryClient = useQueryClient()`
- Após a linha 102 (fechamento do `.insert()`), adicionar `queryClient.invalidateQueries({ queryKey: ["budget_quotes", projectId] })` dentro do bloco `try`

### Resultado
A aba Orçamentos refletirá imediatamente qualquer budget_quote criado automaticamente pela mudança de status no Escopo.

1 arquivo editado. Nenhuma aba, sub-aba ou rota alterada.

