

## Corrigir RLS de `client_portal_tokens` — restringir ao time

### Problema

A tabela `client_portal_tokens` **não tem coluna `user_id`**. As políticas RLS atuais usam `WITH CHECK (true)` e `USING (true)`, permitindo que qualquer usuário autenticado veja/edite tokens de qualquer projeto.

### Solução

Uma única migration que:

1. Adiciona coluna `user_id uuid` (nullable inicialmente)
2. Preenche retroativamente via JOIN com `projects.user_id`
3. Torna a coluna `NOT NULL`
4. Dropa as 3 políticas abertas existentes
5. Cria 4 políticas de equipe no padrão consolidado

### Migration SQL

```sql
-- 1. Adicionar coluna user_id
ALTER TABLE public.client_portal_tokens
  ADD COLUMN user_id uuid;

-- 2. Preencher retroativamente via projects
UPDATE public.client_portal_tokens t
SET user_id = p.user_id
FROM public.projects p
WHERE t.project_id = p.id;

-- 3. Deletar órfãos sem projeto (user_id ficaria NULL)
DELETE FROM public.client_portal_tokens WHERE user_id IS NULL;

-- 4. Tornar NOT NULL
ALTER TABLE public.client_portal_tokens
  ALTER COLUMN user_id SET NOT NULL;

-- 5. Dropar políticas abertas
DROP POLICY IF EXISTS "Authenticated can insert tokens" ON public.client_portal_tokens;
DROP POLICY IF EXISTS "Authenticated can update tokens" ON public.client_portal_tokens;
DROP POLICY IF EXISTS "Authenticated can view tokens" ON public.client_portal_tokens;

-- 6. Criar políticas de equipe
CREATE POLICY "Team can view client_portal_tokens" ON public.client_portal_tokens
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create client_portal_tokens" ON public.client_portal_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update client_portal_tokens" ON public.client_portal_tokens
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete client_portal_tokens" ON public.client_portal_tokens
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
```

### Código frontend

Atualizar `useClientPortalToken.ts` — o `insert` precisa incluir `user_id`:

```typescript
// Na mutação create, alterar o insert para:
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from("client_portal_tokens" as any)
  .insert({ project_id: projectId!, user_id: user!.id } as any)
  .select()
  .single();
```

A edge function `get-client-portal-data` e a página `/client/:token` **não são alteradas** — usam service role key e não passam por RLS.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar `user_id`, preencher, dropar 3 políticas abertas, criar 4 de equipe |
| `src/hooks/useClientPortalToken.ts` | Incluir `user_id` no insert |

