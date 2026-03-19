

## Encadeamento automático: Escopo → Orçamentos → Materiais

### Contexto atual
- `budget_quotes` já tem coluna `scope_item_id` (FK para `scope_items`) — rastreabilidade existe no schema
- `material_tracking` já tem `budget_quote_id` (FK para `budget_quotes`) e coluna `source`
- Nenhuma automação conecta as abas hoje — tudo é manual ou via importação explícita

### Alterações

**1. `src/hooks/useScopeItems.ts`** — Encadear criação de budget_quote ao criar scope item
- No `onSuccess` do `create`, após invalidar queries, inserir automaticamente um `budget_quote` com `scope_item_id` apontando para o item recém-criado, `status: "pendente"`, e `services_description` preenchido com a discipline + description do escopo
- Problema: o `create` mutation atual não retorna o ID do item criado. Alterar para usar `.insert(...).select().single()` e retornar o registro inserido
- No `onSuccess`, chamar inserção no `budget_quotes` com os dados do item retornado
- Também invalidar `budget_quotes` queries

**2. `src/hooks/useScenarios.ts`** — Encadear na aprovação de cenário
- Após inserir os scope items "contratado" (linha ~167-179), buscar os IDs recém-inseridos e criar budget_quotes correspondentes para cada um
- Invalidar `budget_quotes` queries no `onSuccess`

**3. `src/hooks/useBudgetQuotes.ts`** — Encadear criação de material_tracking ao preencher material_estimate
- No `create` e `update` mutations, quando `material_estimate > 0`, verificar se já existe um `material_tracking` com `budget_quote_id` correspondente
- Se não existir, criar automaticamente um item em `material_tracking` com `source: "orcamento"`, `quantity_needed` = `material_estimate`, e discipline do scope item vinculado
- Invalidar `material_tracking` queries

**4. `src/components/projects/ProjectScopeTab.tsx`** — Encadear na mudança de status
- Na função `handleStatusChange`, ao mudar para `contratado` ou adiante, verificar se já existe budget_quote para o `scope_item_id`. Se não, criar automaticamente

### Rastreabilidade
- Cada `budget_quote` terá `scope_item_id` indicando a origem no escopo
- Cada `material_tracking` terá `budget_quote_id` e `source: "orcamento"` indicando a origem no orçamento
- O preenchimento manual continua possível em todas as abas (campos opcionais)

### Resumo
- 4 arquivos editados
- 0 migrações (schema já tem as colunas necessárias)
- Nenhuma aba, sub-aba ou rota alterada

