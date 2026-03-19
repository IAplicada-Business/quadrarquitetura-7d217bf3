

## Condicionar criação automática de budget_quote no useScopeItems.create

### Alteração

**`src/hooks/useScopeItems.ts`** — linhas 54-65

Envolver a inserção automática de `budget_quote` com uma guarda que verifica:
1. `data.scope_type === "contratado"`
2. `data.status` está em `["contratado", "em_execucao", "executado"]`

Ambas as condições devem ser verdadeiras. Caso contrário, o bloco de inserção é ignorado silenciosamente.

```
const BUDGET_ELIGIBLE_STATUSES = ["contratado", "em_execucao", "executado"];
const shouldCreateBudget = data.scope_type === "contratado" 
  && BUDGET_ELIGIBLE_STATUSES.includes(data.status);
```

### Resumo
- 1 arquivo editado, ~3 linhas adicionadas
- Nenhuma aba, sub-aba ou rota alterada

