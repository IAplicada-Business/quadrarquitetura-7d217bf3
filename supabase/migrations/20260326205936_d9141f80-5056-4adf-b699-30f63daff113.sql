ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS timeline_mobilization integer DEFAULT NULL;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS timeline_fiscalization integer DEFAULT NULL;