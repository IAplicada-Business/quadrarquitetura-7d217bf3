
-- Part 1: Add status column to scope_items
ALTER TABLE public.scope_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planejado';

-- Part 2: Create site_diary_entries table
CREATE TABLE public.site_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weather TEXT,
  workers_count INTEGER,
  summary TEXT,
  observations TEXT,
  photos TEXT[],
  disciplines_active TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own site_diary_entries"
ON public.site_diary_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create site_diary_entries"
ON public.site_diary_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own site_diary_entries"
ON public.site_diary_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own site_diary_entries"
ON public.site_diary_entries FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_site_diary_entries_updated_at
BEFORE UPDATE ON public.site_diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
