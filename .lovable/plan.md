

## FKs nas tabelas de suporte — CASCADE → RESTRICT

### Estado atual (verificado no banco)

| Tabela | FK existente | Ref | Tipo atual | Ação |
|---|---|---|---|---|
| `budget_quote_items` | `budget_quote_items_budget_quote_id_fkey` | `budget_quotes` | CASCADE (c) | Alterar para RESTRICT |
| `discipline_priorities` | `discipline_priorities_project_id_fkey` | `projects` | CASCADE (c) | Alterar para RESTRICT |
| `discipline_priorities` | `discipline_priorities_scope_item_id_fkey` | `scope_items` | CASCADE (c) | Alterar para RESTRICT |
| `chat_messages` | `chat_messages_conversation_id_fkey` | `chat_conversations` | CASCADE (c) | Manter CASCADE (faz sentido deletar mensagens ao deletar conversa) |

### Decisão sobre `chat_messages`

A FK já existe com CASCADE. Deletar uma conversa deve deletar suas mensagens — CASCADE é o comportamento correto aqui. Não será alterada.

### Migration SQL

```sql
-- budget_quote_items → budget_quotes: CASCADE → RESTRICT
ALTER TABLE public.budget_quote_items
  DROP CONSTRAINT budget_quote_items_budget_quote_id_fkey;
ALTER TABLE public.budget_quote_items
  ADD CONSTRAINT fk_budget_quote_items_quote
  FOREIGN KEY (budget_quote_id) REFERENCES public.budget_quotes(id) ON DELETE RESTRICT;

-- discipline_priorities → projects: CASCADE → RESTRICT
ALTER TABLE public.discipline_priorities
  DROP CONSTRAINT discipline_priorities_project_id_fkey;
ALTER TABLE public.discipline_priorities
  ADD CONSTRAINT fk_discipline_priorities_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- discipline_priorities → scope_items: CASCADE → RESTRICT
ALTER TABLE public.discipline_priorities
  DROP CONSTRAINT discipline_priorities_scope_item_id_fkey;
ALTER TABLE public.discipline_priorities
  ADD CONSTRAINT fk_discipline_priorities_scope_item
  FOREIGN KEY (scope_item_id) REFERENCES public.scope_items(id) ON DELETE RESTRICT;
```

Não é necessário limpar órfãos — as FKs já existem, os dados já são íntegros.

### Código frontend

Nenhuma alteração necessária. O `handleDeleteError` já cobre `projects` com mensagem amigável.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Drop 3 FKs CASCADE + criar 3 FKs RESTRICT |

