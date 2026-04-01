
CREATE TABLE supplier_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE RESTRICT NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  discipline text,
  activities jsonb,
  sent_at timestamptz,
  status text DEFAULT 'gerado' CHECK (status IN ('gerado','enviado','orcado','aprovado')),
  quoted_value numeric,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view supplier_scopes" ON supplier_scopes FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create supplier_scopes" ON supplier_scopes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update supplier_scopes" ON supplier_scopes FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete supplier_scopes" ON supplier_scopes FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
