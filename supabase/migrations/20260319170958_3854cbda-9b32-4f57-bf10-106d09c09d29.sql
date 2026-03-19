ALTER TABLE schedule_tasks 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS environment text,
  ADD COLUMN IF NOT EXISTS estimated_days integer,
  ADD COLUMN IF NOT EXISTS dependencies uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]';