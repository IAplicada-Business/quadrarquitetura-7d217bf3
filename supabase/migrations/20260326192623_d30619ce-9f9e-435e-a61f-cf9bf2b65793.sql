ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS ambientes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS total_area numeric;