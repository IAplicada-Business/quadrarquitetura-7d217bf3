-- 1. Adicionar coluna user_id
ALTER TABLE public.client_portal_tokens
  ADD COLUMN user_id uuid;

-- 2. Preencher retroativamente via projects
UPDATE public.client_portal_tokens t
SET user_id = p.user_id
FROM public.projects p
WHERE t.project_id = p.id;

-- 3. Deletar órfãos sem projeto
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