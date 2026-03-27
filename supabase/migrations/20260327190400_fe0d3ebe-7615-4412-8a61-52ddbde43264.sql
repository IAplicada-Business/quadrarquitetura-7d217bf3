DROP POLICY IF EXISTS "Users can delete own rules" ON public.calculation_rules;
DROP POLICY IF EXISTS "Users can insert own rules" ON public.calculation_rules;
DROP POLICY IF EXISTS "Users can update own rules" ON public.calculation_rules;
DROP POLICY IF EXISTS "Users can view own rules" ON public.calculation_rules;

CREATE POLICY "Team can view calculation_rules" ON public.calculation_rules
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create calculation_rules" ON public.calculation_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update calculation_rules" ON public.calculation_rules
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete calculation_rules" ON public.calculation_rules
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));