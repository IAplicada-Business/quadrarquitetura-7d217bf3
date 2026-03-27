-- Drop individual policies
DROP POLICY IF EXISTS "Users can view own plant_analyses" ON public.plant_analyses;
DROP POLICY IF EXISTS "Users can insert own plant_analyses" ON public.plant_analyses;
DROP POLICY IF EXISTS "plant_analyses_update" ON public.plant_analyses;
DROP POLICY IF EXISTS "Users can delete own plant_analyses" ON public.plant_analyses;

-- Create team policies
CREATE POLICY "plant_analyses_team_select" ON public.plant_analyses
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT get_team_user_ids()));

CREATE POLICY "plant_analyses_team_insert" ON public.plant_analyses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "plant_analyses_team_update" ON public.plant_analyses
  FOR UPDATE TO authenticated
  USING (user_id IN (SELECT get_team_user_ids()));

CREATE POLICY "plant_analyses_team_delete" ON public.plant_analyses
  FOR DELETE TO authenticated
  USING (user_id IN (SELECT get_team_user_ids()));