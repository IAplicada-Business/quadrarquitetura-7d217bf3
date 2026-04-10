UPDATE projects
SET project_number = sub.new_number
FROM (
  SELECT id, 'Q' || (ROW_NUMBER() OVER (ORDER BY created_at) + 144)::text AS new_number
  FROM projects
  WHERE project_number IS NULL
     OR (project_number LIKE 'Q%' AND (REPLACE(project_number, 'Q', ''))::integer < 145)
) sub
WHERE projects.id = sub.id;