ALTER TABLE schedule_tasks
  ADD COLUMN IF NOT EXISTS source_activity_id uuid
    REFERENCES project_activities(id) ON DELETE SET NULL;