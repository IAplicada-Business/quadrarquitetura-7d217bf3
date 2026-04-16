

## Plano: Corrigir visibilidade de clientes convertidos

### Problema identificado

A tabela `clients` usa políticas RLS baseadas em `auth.uid() = user_id` (acesso individual), enquanto quase todas as outras tabelas operacionais usam `get_team_user_ids()` (acesso por equipe). Isso impede que membros da mesma equipe vejam os clientes criados por colegas.

Os leads fechados **já estão sendo convertidos corretamente** — existem 2 leads fechados com `converted_client_id` preenchido e os clientes correspondentes no banco. O problema é puramente de visibilidade via RLS.

### Alterações

**1. Migração de banco — atualizar RLS da tabela `clients`**

Substituir as 4 políticas atuais (SELECT, UPDATE, DELETE usam `auth.uid() = user_id`) por políticas team-based:

```sql
-- DROP das políticas antigas
DROP POLICY "Users can view own clients" ON clients;
DROP POLICY "Users can update own clients" ON clients;
DROP POLICY "Users can delete own clients" ON clients;
DROP POLICY "Users can create clients" ON clients;

-- Novas políticas team-based
CREATE POLICY "Team can view clients" ON clients FOR SELECT
  USING (user_id IN (SELECT get_team_user_ids()));

CREATE POLICY "Team can update clients" ON clients FOR UPDATE
  USING (user_id IN (SELECT get_team_user_ids()));

CREATE POLICY "Team can delete clients" ON clients FOR DELETE
  USING (user_id IN (SELECT get_team_user_ids()));

CREATE POLICY "Team can create clients" ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### O que NÃO muda
- Código da página `Clients.tsx`, hooks, rotas, lógica de conversão de leads

