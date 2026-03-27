

## Migrar RLS de equipe para tabelas secundárias

### Resumo

Atualizar as políticas RLS de 16 tabelas secundárias para usar `get_team_user_ids()`, mantendo o padrão já aplicado em leads/proposals/contracts/projects: SELECT/UPDATE/DELETE usam `user_id IN (SELECT get_team_user_ids())`, INSERT usa `auth.uid() = user_id`.

### Migration SQL

Uma única migration que para cada tabela:
1. Dropa as 4 políticas individuais existentes (SELECT, INSERT, UPDATE, DELETE)
2. Cria 4 novas políticas de equipe

**Tabelas afetadas (16):**
- `scope_items`, `schedule_tasks`, `scenarios`, `site_tracking`, `site_visits`
- `material_tracking`, `material_calculations`, `budget_quote_items`
- `budgets`, `payments`, `invoices`, `documents`
- `supplier_allocations`, `suppliers`
- `proposal_assets`, `contract_templates`

**Padrão por tabela:**
```sql
-- Exemplo para scope_items (repetir para todas)
DROP POLICY IF EXISTS "Users can view own scope_items" ON public.scope_items;
DROP POLICY IF EXISTS "Users can create scope_items" ON public.scope_items;
DROP POLICY IF EXISTS "Users can update own scope_items" ON public.scope_items;
DROP POLICY IF EXISTS "Users can delete own scope_items" ON public.scope_items;

CREATE POLICY "Team can view scope_items" ON public.scope_items
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create scope_items" ON public.scope_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update scope_items" ON public.scope_items
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete scope_items" ON public.scope_items
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
```

**Nomes exatos das políticas a dropar** (baseados no schema atual):

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| scope_items | "Users can view own scope_items" | "Users can create scope_items" | "Users can update own scope_items" | "Users can delete own scope_items" |
| schedule_tasks | "Users can view own schedule_tasks" | "Users can create schedule_tasks" | "Users can update own schedule_tasks" | "Users can delete own schedule_tasks" |
| scenarios | "Users can view own scenarios" | "Users can create scenarios" | "Users can update own scenarios" | "Users can delete own scenarios" |
| site_tracking | "Users can view own tracking" | "Users can create tracking" | "Users can update own tracking" | "Users can delete own tracking" |
| site_visits | "Users can view own site_visits" | "Users can insert own site_visits" | "Users can update own site_visits" | "Users can delete own site_visits" |
| material_tracking | "Users can view own material_tracking" | "Users can create material_tracking" | "Users can update own material_tracking" | "Users can delete own material_tracking" |
| material_calculations | "Users can view own material_calculations" | "Users can create material_calculations" | "Users can update own material_calculations" | "Users can delete own material_calculations" |
| budget_quote_items | "Users can view own budget_quote_items" | "Users can create budget_quote_items" | "Users can update own budget_quote_items" | "Users can delete own budget_quote_items" |
| budgets | "Users can view own budgets" | "Users can create budgets" | "Users can update own budgets" | "Users can delete own budgets" |
| payments | "Users can view own payments" | "Users can create payments" | "Users can update own payments" | "Users can delete own payments" |
| invoices | "Users can view own invoices" | "Users can create invoices" | "Users can update own invoices" | "Users can delete own invoices" |
| documents | "Users can view own documents" | "Users can create documents" | "Users can update own documents" | "Users can delete own documents" |
| supplier_allocations | "Users can view own allocations" | "Users can insert own allocations" | "Users can update own allocations" | "Users can delete own allocations" |
| suppliers | "Users can view own suppliers" | "Users can create suppliers" | "Users can update own suppliers" | "Users can delete own suppliers" |
| proposal_assets | "Users can view own proposal_assets" | "Users can insert own proposal_assets" | "Users can update own proposal_assets" | "Users can delete own proposal_assets" |
| contract_templates | "Users can view own contract_templates" | "Users can create contract_templates" | "Users can update own contract_templates" | "Users can delete own contract_templates" |

**Nota**: `reports` e `proposal_templates` também usam RLS individual — incluí-las se forem operacionais. Pelo prompt ficam de fora, mas vale considerar.

### Tabelas que permanecem individuais
`calculation_rules`, `settings`, `chat_messages`, `plant_analyses`, `discipline_priorities` — sem alteração.

### Código frontend
Nenhuma alteração necessária. Os hooks já fazem queries sem `.eq("user_id")` nas tabelas de projeto (usam `.eq("project_id")`), e a RLS cuida do filtro.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Drop 64 políticas individuais + criar 64 políticas de equipe (4 por tabela × 16 tabelas) |

Nenhum arquivo de código precisa ser alterado.

