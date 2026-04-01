
ALTER TABLE weekly_reports
  ADD COLUMN IF NOT EXISTS client_responses jsonb DEFAULT '[]';

CREATE TABLE client_pending_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_report_id uuid REFERENCES weekly_reports(id) ON DELETE CASCADE NOT NULL,
  project_id uuid NOT NULL,
  pending_item text NOT NULL,
  response_text text,
  status text DEFAULT 'aguardando',
  responded_at timestamptz,
  client_name text,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_pending_response_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('aguardando','respondido','aprovado','rejeitado') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pending_response_status
  BEFORE INSERT OR UPDATE ON client_pending_responses
  FOR EACH ROW EXECUTE FUNCTION validate_pending_response_status();

ALTER TABLE client_pending_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert responses" ON client_pending_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Public can update responses" ON client_pending_responses
  FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Team can view responses" ON client_pending_responses
  FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p WHERE p.user_id IN (SELECT get_team_user_ids())
  ));

CREATE POLICY "Team can delete responses" ON client_pending_responses
  FOR DELETE TO authenticated
  USING (project_id IN (
    SELECT p.id FROM projects p WHERE p.user_id IN (SELECT get_team_user_ids())
  ));
