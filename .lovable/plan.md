

## Respostas do Cliente no Portal + Notificações para Equipe

### 1. Migration SQL

```sql
-- Adicionar campo de respostas no weekly_reports
ALTER TABLE weekly_reports
  ADD COLUMN IF NOT EXISTS client_responses jsonb DEFAULT '[]';

-- Tabela de respostas individuais
CREATE TABLE client_pending_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_report_id uuid REFERENCES weekly_reports(id) ON DELETE CASCADE NOT NULL,
  project_id uuid NOT NULL,
  pending_item text NOT NULL,
  response_text text,
  status text DEFAULT 'aguardando',
  responded_at timestamptz,
  client_name text,
  created_at timestamptz DEFAULT now()
);

-- Usar validation trigger em vez de CHECK constraint
CREATE OR REPLACE FUNCTION validate_pending_response_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('aguardando','respondido','aprovado','rejeitado') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pending_response_status
  BEFORE INSERT OR UPDATE ON client_pending_responses
  FOR EACH ROW EXECUTE FUNCTION validate_pending_response_status();

ALTER TABLE client_pending_responses ENABLE ROW LEVEL SECURITY;

-- INSERT/UPDATE público (portal sem login, validação via edge function)
CREATE POLICY "Public can insert responses" ON client_pending_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can update responses" ON client_pending_responses
  FOR UPDATE TO anon, authenticated USING (true);

-- SELECT restrito à equipe
CREATE POLICY "Team can view responses" ON client_pending_responses
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p WHERE p.user_id IN (SELECT get_team_user_ids())
  ));

-- DELETE restrito à equipe
CREATE POLICY "Team can delete responses" ON client_pending_responses
  FOR DELETE TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p WHERE p.user_id IN (SELECT get_team_user_ids())
  ));
```

### 2. Edge Function: `get-client-portal-data/index.ts`

Adicionar ao fetch paralelo:
- Buscar `client_pending_responses` filtradas por `project_id` do token
- Retornar no JSON como `pending_responses: [...]`

### 3. Nova Edge Function: `submit-client-response/index.ts`

Recebe: `{ token, weekly_report_id, pending_item, response_text, status, client_name }`

Fluxo:
1. Validar token em `client_portal_tokens` (ativo + não expirado)
2. Extrair `project_id` do token
3. Inserir em `client_pending_responses` usando service_role
4. Buscar nome do projeto para a notificação
5. Inserir notificação para admins: `{ type: 'client_response', title: 'Resposta do cliente', message: 'Cliente respondeu pendência no projeto [nome]', related_entity_type: 'project', related_entity_id: project_id }`
6. Retornar sucesso

Config em `supabase/config.toml`: `[functions.submit-client-response] verify_jwt = false`

### 4. Portal do Cliente: `ClientPortal.tsx`

Na seção de cada relatório semanal com `client_pending`:
- Parsear `client_pending` (texto) como item de pendência
- Verificar se já existe resposta em `pending_responses` para esse report
- Se não respondido: exibir textarea + botões "Aprovar" e "Responder"
- Ao clicar "Aprovar": prompt simples para nome → POST para `submit-client-response` com `status='aprovado'`
- Ao clicar "Responder": modal com textarea obrigatória + campo nome → POST com `status='respondido'`
- Se já respondido: exibir resposta, timestamp e badge de status (verde=aprovado, azul=respondido)

### 5. Sistema Interno: `ProjectTrackingTab.tsx`

Adicionar seção "Respostas do Cliente" no final:
- Buscar `client_pending_responses` do projeto via hook
- Agrupar por `weekly_report_id` (mostrar label da semana)
- Cada resposta: pendência, resposta, nome do cliente, data, badge de status
- Badge no título da seção quando houver respostas novas (status != 'aguardando' nas últimas 48h)

### Arquivos alterados

| Arquivo | Acao |
|---|---|
| Migration SQL | `client_responses` em weekly_reports + tabela `client_pending_responses` |
| `supabase/functions/get-client-portal-data/index.ts` | Buscar e retornar `pending_responses` |
| `supabase/functions/submit-client-response/index.ts` | **Novo** — salvar resposta + criar notificação |
| `supabase/config.toml` | Adicionar `[functions.submit-client-response]` |
| `src/pages/ClientPortal.tsx` | UI de resposta/aprovação de pendências |
| `src/components/projects/ProjectTrackingTab.tsx` | Seção "Respostas do Cliente" |

Nenhuma outra rota, aba ou funcionalidade alterada.

