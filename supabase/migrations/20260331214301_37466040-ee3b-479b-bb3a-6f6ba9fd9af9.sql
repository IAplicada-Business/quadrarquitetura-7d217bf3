ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_number integer;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM projects
)
UPDATE projects SET project_number = numbered.rn
FROM numbered WHERE projects.id = numbered.id;