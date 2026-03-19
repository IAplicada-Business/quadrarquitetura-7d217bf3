

## Filtrar material_tracking por revisão ativa do orçamento

### Problema
Ao criar Rev 2 de budget_quotes, os material_tracking da Rev 1 continuam aparecendo na aba Materiais, misturando dados de revisões antigas e atuais.

### Solução

**1. Migration SQL** — adicionar coluna `is_active` na tabela `material_tracking`:

```sql
ALTER TABLE material_tracking 
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
```

**2. `src/hooks/useBudgetQuotes.ts`** — no `createRevision`, após marcar quotes como `is_current_revision = false`:
- Buscar todos `material_tracking` vinculados aos budget_quotes da revisão anterior (via `budget_quote_id`) e setar `is_active = false`
- Após inserir cada novo budget_quote da nova revisão, chamar `autoCreateMaterialTracking` para criar novos registros `is_active = true`
- Invalidar cache de `material_tracking`

Lógica adicionada dentro do `mutationFn` do `createRevision`:

```text
1. Coletar IDs dos budget_quotes da revisão anterior
2. UPDATE material_tracking SET is_active = false WHERE budget_quote_id IN (ids anteriores)
3. Para cada novo quote inserido (com material_estimate > 0), criar material_tracking com is_active = true
```

**3. `src/hooks/useMaterialTracking.ts`** — no query, adicionar filtro `.eq("is_active", true)` para que a aba Materiais exiba apenas registros ativos.

**4. `src/hooks/useBudgetQuotes.ts`** — na função `autoCreateMaterialTracking`, garantir que novos registros criados incluam `is_active: true` explicitamente.

### Resumo
- 1 migration SQL (1 coluna adicionada)
- 2 arquivos editados (filtro no query + lógica na criação de revisão)
- Nenhuma aba, sub-aba ou rota alterada

