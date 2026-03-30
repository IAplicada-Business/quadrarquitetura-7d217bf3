

## Resultado: Todas as FKs já existem

A query em `pg_constraint` retornou **todas as 7 FKs** já aplicadas com `ON DELETE RESTRICT`:

| Tabela | Constraint |
|---|---|
| `budgets` | `fk_budgets_project` |
| `payments` | `fk_payments_project` |
| `documents` | `fk_documents_project` |
| `scope_items` | `fk_scope_items_project` |
| `invoices` | `fk_invoices_project` |
| `scenarios` | `fk_scenarios_project` |
| `reports` | `fk_reports_project` |

A inconsistência que você notou é apenas visual: o schema exportado pelo Supabase nem sempre inclui FKs na seção `<foreign-keys>` do contexto automático, mas elas **existem no banco**. As migrations anteriores aplicaram tudo corretamente.

**Nenhuma ação necessária.** O banco está íntegro.

