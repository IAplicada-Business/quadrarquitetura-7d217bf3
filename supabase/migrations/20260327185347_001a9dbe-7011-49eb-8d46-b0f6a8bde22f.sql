
-- proposal_templates: drop individual policies
DROP POLICY IF EXISTS "Users can create proposal_templates" ON public.proposal_templates;
DROP POLICY IF EXISTS "Users can view own proposal_templates" ON public.proposal_templates;
DROP POLICY IF EXISTS "Users can update own proposal_templates" ON public.proposal_templates;
DROP POLICY IF EXISTS "Users can delete own proposal_templates" ON public.proposal_templates;

-- proposal_templates: create team policies
CREATE POLICY "Team can view proposal_templates" ON public.proposal_templates
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create proposal_templates" ON public.proposal_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update proposal_templates" ON public.proposal_templates
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete proposal_templates" ON public.proposal_templates
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- reports: drop individual policies
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;

-- reports: create team policies
CREATE POLICY "Team can view reports" ON public.reports
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update reports" ON public.reports
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete reports" ON public.reports
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
