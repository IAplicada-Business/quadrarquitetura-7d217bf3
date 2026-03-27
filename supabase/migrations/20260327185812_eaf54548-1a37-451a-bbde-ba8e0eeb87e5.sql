DROP POLICY IF EXISTS "Users can create discipline_priorities" ON public.discipline_priorities;
DROP POLICY IF EXISTS "Users can view own discipline_priorities" ON public.discipline_priorities;
DROP POLICY IF EXISTS "Users can update own discipline_priorities" ON public.discipline_priorities;
DROP POLICY IF EXISTS "Users can delete own discipline_priorities" ON public.discipline_priorities;

CREATE POLICY "Team can view discipline_priorities" ON public.discipline_priorities
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create discipline_priorities" ON public.discipline_priorities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update discipline_priorities" ON public.discipline_priorities
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete discipline_priorities" ON public.discipline_priorities
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));