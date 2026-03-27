

## Alterar FKs de `ON DELETE CASCADE` para `ON DELETE RESTRICT` nas tabelas secundárias de projetos

### Estado atual

Todas as 7 tabelas listadas **já possuem** foreign keys para `projects(id)`, mas com `ON DELETE CASCADE`. Isso significa que deletar um projeto apaga silenciosamente todos os dados vinculados (escopo, cronograma, materiais, pagamentos, etc.).

Além das 7 tabelas do prompt, existem outras que também referenciam `projects(id)` com CASCADE:
- `budget_quotes`, `material_calculations`, `invoices`, `pending_items`, `purchases`, `scenarios`, `site_diary_entries`, `documents`, `reports`, `voice_tasks`, `discipline_priorities`, `discipline_material_estimates`, `plant_analyses`, `site_visits`, `supplier_allocations`

### Migration SQL

Para cada tabela: dropar a FK existente e recriar com `ON DELETE RESTRICT`.

```sql
-- Padrão para cada tabela:
ALTER TABLE public.[tabela] DROP CONSTRAINT [nome_constraint_existente];
ALTER TABLE public.[tabela] ADD CONSTRAINT fk_[tabela]_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;
```

**Tabelas a migrar (conforme prompt — 7 tabelas):**
1. `scope_items`
2. `schedule_tasks`
3. `budgets`
4. `payments`
5. `material_tracking`
6. `site_tracking`
7. `supplier_allocations`

Não é necessário limpar órfãos — todas as FKs já existem, então não há registros com `project_id` inválido.

Os nomes das constraints existentes precisam ser descobertos. A migration usará `DROP CONSTRAINT IF EXISTS` com o nome gerado pelo Postgres (normalmente `[tabela]_project_id_fkey`).

### Código frontend

A função `handleDeleteError` já existe em `src/lib/handleDeleteError.ts`. Basta adicionar uma entrada para `projects`:

```typescript
const FK_MESSAGES: Record<string, string> = {
  leads: "...",
  proposals: "...",
  projects: "Este projeto possui dados vinculados (escopo, cronograma, materiais, etc.) e não pode ser excluído. Remova os dados do projeto primeiro.",
};
```

E usar `handleDeleteError(e, "projects")` no hook de deleção de projetos (se existir).

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Alterar ON DELETE de CASCADE para RESTRICT em 7 FKs |
| `src/lib/handleDeleteError.ts` | Adicionar mensagem para `projects` |

