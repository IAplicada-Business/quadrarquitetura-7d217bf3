

## Cascata de deleção: Scope → Budget Quotes → Material Tracking

### Situação atual
As colunas `budget_quotes.scope_item_id` e `material_tracking.budget_quote_id` existem mas **não possuem foreign key constraints**. A deleção de um scope_item deixa budget_quotes e material_tracking órfãos.

### Solução: Migration SQL

Adicionar foreign keys com `ON DELETE CASCADE` em ambas as tabelas:

**Migration SQL:**
```sql
ALTER TABLE budget_quotes
  ADD CONSTRAINT fk_budget_quotes_scope_item
  FOREIGN KEY (scope_item_id) REFERENCES scope_items(id) ON DELETE CASCADE;

ALTER TABLE material_tracking
  ADD CONSTRAINT fk_material_tracking_budget_quote
  FOREIGN KEY (budget_quote_id) REFERENCES budget_quotes(id) ON DELETE CASCADE;
```

### Resultado
- Ao deletar um `scope_item`, todos os `budget_quotes` vinculados são deletados automaticamente pelo banco
- Ao deletar um `budget_quote`, todos os `material_tracking` vinculados são deletados automaticamente
- O hook `useScopeItems.ts` continua com o `remove` simples — o cascade acontece no banco
- Invalidação de queries de `budget_quotes` e `material_tracking` será adicionada no `onSuccess` do `remove` em `useScopeItems.ts` para atualizar o cache

### Alterações
1. **1 migration SQL** — adicionar 2 foreign keys com CASCADE
2. **`src/hooks/useScopeItems.ts`** — no `onSuccess` do `remove`, invalidar também `["budget_quotes", projectId]` e `["material_tracking", projectId]`

Nenhuma aba, sub-aba ou rota alterada.

