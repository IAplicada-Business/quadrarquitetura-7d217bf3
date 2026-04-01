ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS cotacao_aprovada boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cotacao_valor_total numeric,
  ADD COLUMN IF NOT EXISTS cotacao_aprovada_at timestamptz;