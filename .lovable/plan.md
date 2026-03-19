

## Configurar ON DELETE behavior para todas as FKs apontando para scope_items e budget_quotes

### Análise das FKs existentes

**Tabelas com FK para `scope_items`:**
1. `budget_quotes.scope_item_id` — já tem `fk_budget_quotes_scope_item` com CASCADE (migration anterior) + FK original `budget_quotes_scope_item_id_fkey` (duplicada, precisa dropar a original)
2. `discipline_priorities.scope_item_id` — FK existe, sem CASCADE
3. `discipline_material_estimates.scope_item_id` — FK existe, sem CASCADE
4. `schedule_tasks.scope_item_id` — FK existe, sem CASCADE
5. `scope_items.parent_id` — auto-referência, FK existe

**Tabelas com FK para `budget_quotes`:**
1. `material_tracking.budget_quote_id` — já tem CASCADE (migration anterior)
2. `budget_quote_items.budget_quote_id` — FK existe, sem CASCADE
3. `payments.budget_quote_id` — FK existe, sem CASCADE

### Decisão por tabela

| Tabela | FK | Comportamento | Motivo |
|---|---|---|---|
| `budget_quotes` → `scope_items` | `budget_quotes_scope_item_id_fkey` | DROP (duplicada) | Já existe `fk_budget_quotes_scope_item` com CASCADE |
| `discipline_priorities` → `scope_items` | CASCADE | Prioridades são metadados do escopo, devem sumir junto |
| `discipline_material_estimates` → `scope_items` | CASCADE | Estimativas são derivadas do escopo |
| `schedule_tasks` → `scope_items` | SET NULL | Tarefas podem existir independentemente; desvincula mas preserva |
| `scope_items.parent_id` → `scope_items` | SET NULL | Sub-itens devem virar itens raiz, não serem deletados |
| `budget_quote_items` → `budget_quotes` | CASCADE | Itens de detalhe do orçamento, devem sumir junto |
| `payments` → `budget_quotes` | SET NULL | Pagamentos realizados não devem desaparecer |

### Alterações

**1. Migration SQL** — 7 alterações de FK:

```sql
-- Remover FK duplicada de budget_quotes
ALTER TABLE budget_quotes DROP CONSTRAINT budget_quotes_scope_item_id_fkey;

-- discipline_priorities → CASCADE
ALTER TABLE discipline_priorities 
  DROP CONSTRAINT discipline_priorities_scope_item_id_fkey,
  ADD CONSTRAINT discipline_priorities_scope_item_id_fkey 
    FOREIGN KEY (scope_item_id) REFERENCES scope_items(id) ON DELETE CASCADE;

-- discipline_material_estimates → CASCADE
ALTER TABLE discipline_material_estimates 
  DROP CONSTRAINT discipline_material_estimates_scope_item_id_fkey,
  ADD CONSTRAINT discipline_material_estimates_scope_item_id_fkey 
    FOREIGN KEY (scope_item_id) REFERENCES scope_items(id) ON DELETE CASCADE;

-- schedule_tasks → SET NULL
ALTER TABLE schedule_tasks 
  DROP CONSTRAINT schedule_tasks_scope_item_id_fkey,
  ADD CONSTRAINT schedule_tasks_scope_item_id_fkey 
    FOREIGN KEY (scope_item_id) REFERENCES scope_items(id) ON DELETE SET NULL;

-- scope_items.parent_id → SET NULL
ALTER TABLE scope_items 
  DROP CONSTRAINT scope_items_parent_id_fkey,
  ADD CONSTRAINT scope_items_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES scope_items(id) ON DELETE SET NULL;

-- budget_quote_items → CASCADE
ALTER TABLE budget_quote_items 
  DROP CONSTRAINT budget_quote_items_budget_quote_id_fkey,
  ADD CONSTRAINT budget_quote_items_budget_quote_id_fkey 
    FOREIGN KEY (budget_quote_id) REFERENCES budget_quotes(id) ON DELETE CASCADE;

-- payments → SET NULL
ALTER TABLE payments 
  DROP CONSTRAINT payments_budget_quote_id_fkey,
  ADD CONSTRAINT payments_budget_quote_id_fkey 
    FOREIGN KEY (budget_quote_id) REFERENCES budget_quotes(id) ON DELETE SET NULL;
```

**2. `src/hooks/useScopeItems.ts`** — no `onSuccess` do `remove`, adicionar invalidação de `schedule_tasks` e `discipline_priorities`.

**3. `src/hooks/useBudgetQuotes.ts`** — no `onSuccess` do `remove`, adicionar invalidação de `payments` e `budget_quote_items`.

### Resumo
- 1 migration SQL com 7 alterações de FK
- 2 arquivos editados (invalidação de cache)
- Nenhuma aba, sub-aba ou rota alterada

