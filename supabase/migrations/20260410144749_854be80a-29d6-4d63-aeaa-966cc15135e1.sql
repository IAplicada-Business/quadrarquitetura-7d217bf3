ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS source_lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;