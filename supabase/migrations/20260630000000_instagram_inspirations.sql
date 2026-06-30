-- Instagram inspirações: repositório de posts de referência/inspiração.
CREATE TABLE IF NOT EXISTS public.instagram_inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  source_url text,
  image_url text,
  category text DEFAULT 'geral' CHECK (category IN ('layout', 'copy', 'reels', 'carrossel', 'story', 'branding', 'geral')),
  tags text[],
  notes text,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_inspirations_user ON public.instagram_inspirations(user_id);

ALTER TABLE public.instagram_inspirations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instagram_inspirations_select_own"
  ON public.instagram_inspirations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "instagram_inspirations_insert_own"
  ON public.instagram_inspirations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "instagram_inspirations_update_own"
  ON public.instagram_inspirations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "instagram_inspirations_delete_own"
  ON public.instagram_inspirations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_instagram_inspirations_updated_at
  BEFORE UPDATE ON public.instagram_inspirations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
