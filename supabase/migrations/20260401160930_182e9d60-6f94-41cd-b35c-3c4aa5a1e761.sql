
-- Correção 1: project_number de integer para text (formato Q148)
ALTER TABLE projects ALTER COLUMN project_number TYPE text USING 
  CASE WHEN project_number IS NOT NULL THEN 'Q' || project_number::text ELSE NULL END;

-- Retroativamente numerar projetos sem numeração Q
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM projects
  WHERE project_number IS NULL
)
UPDATE projects SET project_number = 'Q' || numbered.rn::text
FROM numbered WHERE projects.id = numbered.id;

-- Correção 2: coluna source na tabela payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source text DEFAULT 'obra' CHECK (source IN ('escritorio','obra'));
