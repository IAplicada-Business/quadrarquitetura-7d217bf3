
CREATE TABLE price_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE RESTRICT NOT NULL,
  activity_id uuid REFERENCES project_activities(id) ON DELETE CASCADE NOT NULL,
  material_name text NOT NULL,
  price_min numeric,
  price_max numeric,
  price_avg numeric GENERATED ALWAYS AS ((price_min + price_max) / 2) STORED,
  unit text,
  suppliers jsonb DEFAULT '[]'::jsonb,
  searched_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL
);

ALTER TABLE price_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view price_research" ON price_research FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create price_research" ON price_research FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update price_research" ON price_research FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete price_research" ON price_research FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
