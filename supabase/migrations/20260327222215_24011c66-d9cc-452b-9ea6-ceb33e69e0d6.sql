
-- 1. Adicionar coluna scope
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'team';

-- 2. Marcar registros existentes como 'team'
UPDATE public.settings SET scope = 'team' WHERE scope IS NULL OR scope = 'team';

-- 3. Dropar políticas existentes
DROP POLICY IF EXISTS "Users can create settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;

-- 4. Criar novas políticas com escopo
CREATE POLICY "settings_select" ON public.settings
  FOR SELECT TO authenticated
  USING (
    (scope = 'team' AND user_id IN (SELECT get_team_user_ids()))
    OR (scope = 'personal' AND user_id = auth.uid())
  );

CREATE POLICY "settings_insert" ON public.settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings_update" ON public.settings
  FOR UPDATE TO authenticated
  USING (
    (scope = 'team' AND user_id IN (SELECT get_team_user_ids()))
    OR (scope = 'personal' AND user_id = auth.uid())
  );
