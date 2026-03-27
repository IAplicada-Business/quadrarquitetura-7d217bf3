CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  summary text NOT NULL,
  next_steps text NOT NULL,
  completion_percent integer NOT NULL DEFAULT 0,
  photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  client_pending text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_reports_team_select" ON public.weekly_reports
  FOR SELECT TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "weekly_reports_team_insert" ON public.weekly_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_reports_team_update" ON public.weekly_reports
  FOR UPDATE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "weekly_reports_team_delete" ON public.weekly_reports
  FOR DELETE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));