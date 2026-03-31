CREATE TABLE project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  area_m2 numeric,
  duration_days integer,
  start_date date,
  end_date date,
  status text DEFAULT 'pendente',
  progress_percent integer DEFAULT 0,
  depends_on uuid[] DEFAULT '{}',
  discipline text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view project_activities" ON project_activities
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create project_activities" ON project_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update project_activities" ON project_activities
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete project_activities" ON project_activities
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

CREATE OR REPLACE FUNCTION validate_project_activity()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pendente','em_andamento','concluida','bloqueada') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;
  IF NEW.progress_percent < 0 OR NEW.progress_percent > 100 THEN
    RAISE EXCEPTION 'Progresso deve ser entre 0 e 100';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_activity
  BEFORE INSERT OR UPDATE ON project_activities
  FOR EACH ROW EXECUTE FUNCTION validate_project_activity();