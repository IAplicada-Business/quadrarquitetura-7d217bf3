
CREATE TABLE plant_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  focus text NOT NULL,
  instructions text,
  ai_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE plant_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own plant_analyses" ON plant_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own plant_analyses" ON plant_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plant_analyses" ON plant_analyses FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE schedule_tasks ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
