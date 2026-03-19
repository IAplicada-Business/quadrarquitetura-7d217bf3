
-- Add new columns to proposals table
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS project_name text,
  ADD COLUMN IF NOT EXISTS scope_description text,
  ADD COLUMN IF NOT EXISTS services_included text DEFAULT 'ambos',
  ADD COLUMN IF NOT EXISTS timeline_briefing integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS timeline_study integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS timeline_priorities integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS timeline_construction integer DEFAULT 25,
  ADD COLUMN IF NOT EXISTS price_full numeric,
  ADD COLUMN IF NOT EXISTS price_cash numeric,
  ADD COLUMN IF NOT EXISTS installments_count integer,
  ADD COLUMN IF NOT EXISTS installment_entry numeric,
  ADD COLUMN IF NOT EXISTS installment_value numeric,
  ADD COLUMN IF NOT EXISTS price_note text DEFAULT '*Neste valor, não está incluso execução de obra (mão de obra e materiais)',
  ADD COLUMN IF NOT EXISTS portfolio_projects jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS feedback_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pdf_url text;

-- Create proposal_assets table
CREATE TABLE public.proposal_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  name text NOT NULL,
  description text,
  file_url text,
  project_name text,
  project_category text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposal_assets" ON public.proposal_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own proposal_assets" ON public.proposal_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own proposal_assets" ON public.proposal_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own proposal_assets" ON public.proposal_assets FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for proposal assets
INSERT INTO storage.buckets (id, name, public) VALUES ('proposal-assets', 'proposal-assets', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload proposal assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proposal-assets');
CREATE POLICY "Anyone can view proposal assets" ON storage.objects FOR SELECT USING (bucket_id = 'proposal-assets');
CREATE POLICY "Authenticated users can update proposal assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'proposal-assets');
CREATE POLICY "Authenticated users can delete proposal assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'proposal-assets');
