
CREATE TABLE invoices_nf (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  nf_number text,
  nf_type text CHECK (nf_type IN ('emitida','recebida')),
  issuer_name text,
  issuer_cnpj text,
  recipient_name text,
  recipient_cnpj text,
  service_description text,
  amount numeric NOT NULL,
  issue_date date NOT NULL,
  competence_month text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','enviada_contador','arquivada')),
  sent_to_accountant_at timestamptz,
  file_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices_nf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view invoices_nf" ON invoices_nf FOR SELECT TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create invoices_nf" ON invoices_nf FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update invoices_nf" ON invoices_nf FOR UPDATE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete invoices_nf" ON invoices_nf FOR DELETE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));

INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can upload invoices" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'invoices');
CREATE POLICY "Authenticated can read invoices" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'invoices');
CREATE POLICY "Authenticated can delete invoices" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'invoices');
