

## Notificações Automáticas — Cron + Trigger

### Contexto
O sistema de notificações já existe (tabela `notifications`, hook `useNotifications`, painel `NotificationsPanel`). Falta: geração automática via cron e trigger, navegação ao clicar, página completa, e ícones por tipo.

### Alterações

**1. Migration SQL**

- Adicionar INSERT policy para `service_role` na tabela `notifications` (a edge function e o trigger usam service_role, que bypassa RLS — mas o trigger roda como SECURITY DEFINER, inserindo diretamente)
- Criar trigger function `notify_new_lead()` que insere notificação para todos os admins quando um novo `lead_form_submissions` é inserido
- Criar trigger `on_new_lead_submission` AFTER INSERT em `lead_form_submissions`

```sql
-- Trigger function para novo lead (regra 5)
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT user_id FROM user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
    VALUES (
      admin_record.user_id,
      'new_lead',
      'Novo lead recebido',
      COALESCE(NEW.name, '') || ' — ' || COALESCE(NEW.email, 'sem email') || ' — via formulário',
      'lead',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_lead_submission
  AFTER INSERT ON public.lead_form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead();
```

**2. Edge Function `supabase/functions/check-notifications/index.ts`**

- Usa `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS
- Executa 5 queries (regras 1-4 e 6):
  1. **Tarefas atrasadas**: `schedule_tasks` com `end_date < today`, status != 'executado', progress < 100. Anti-duplicação: não cria se já existe notificação `task_overdue` + `related_entity_id` nos últimos 3 dias
  2. **Pagamento vencendo em 3 dias**: `payments` com `due_date` entre hoje e hoje+3, status != 'pago'
  3. **Pagamento vencido**: `payments` com `due_date < today`, status != 'pago'
  4. **Material pendente entrega**: `material_tracking` com `quantity_purchased > quantity_delivered`, `is_active = true`, `purchase_date < today - 7`
  5. **Cotação sem resposta 5+ dias**: `budget_quotes` com `status = 'pendente'`, `created_at < today - 5`
- Cada regra verifica anti-duplicação (mesmo type + reference_id nos últimos 3 dias)
- Insere notificações para o `user_id` do registro original

**3. Cron job** — usar `pg_cron` + `pg_net` para chamar a edge function diariamente às 08:00 BRT (11:00 UTC)

**4. `supabase/config.toml`** — adicionar:
```toml
[functions.check-notifications]
verify_jwt = false
```

**5. `src/components/layout/NotificationsPanel.tsx`** — melhorias:

- Adicionar ícones por tipo de notificação: `task_overdue` → Clock, `payment_due_soon` → AlertTriangle, `payment_overdue` → XCircle, `material_pending_delivery` → Package, `new_lead` → UserPlus, `quote_no_response` → FileQuestion
- Clique na notificação: marca como lida + navega para recurso (`related_entity_type` → rota correspondente)
- Adicionar link "Ver todas" → `/notifications`

**6. Nova página `src/pages/NotificationsPage.tsx`**

- Lista completa de notificações com filtros por tipo e status (lida/não lida)
- Tabela com colunas: tipo, título, mensagem, data, status
- Ações: marcar como lida, excluir
- Rota: `/notifications` adicionada ao `App.tsx`

**7. `src/hooks/useNotifications.ts`** — adicionar realtime subscription para atualizar badge instantaneamente quando trigger insere notificação

### Arquivos criados/editados
- 1 migration SQL (trigger function + trigger)
- 1 edge function criada: `check-notifications/index.ts`
- 1 SQL insert (cron job via pg_cron + pg_net)
- 1 página criada: `NotificationsPage.tsx`
- 2 arquivos editados: `NotificationsPanel.tsx`, `useNotifications.ts`
- 1 rota adicionada: `/notifications` em `App.tsx`
- Nenhuma aba, sub-aba ou rota existente alterada

