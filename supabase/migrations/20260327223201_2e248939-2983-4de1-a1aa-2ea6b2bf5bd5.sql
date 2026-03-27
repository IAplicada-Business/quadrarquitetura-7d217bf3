-- 1. DELETE em settings
CREATE POLICY "settings_delete" ON public.settings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. lead_form_submissions UPDATE — restringir ao time
DROP POLICY IF EXISTS "Authenticated users can update submissions" ON public.lead_form_submissions;
CREATE POLICY "lead_form_submissions_team_update" ON public.lead_form_submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT get_team_user_ids()));