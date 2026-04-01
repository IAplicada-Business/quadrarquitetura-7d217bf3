ALTER TABLE material_tracking
  ADD COLUMN IF NOT EXISTS activity_id uuid REFERENCES project_activities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS calculated_quantity numeric,
  ADD COLUMN IF NOT EXISTS adjusted_quantity numeric;