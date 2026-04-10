
-- Create content_series table
CREATE TABLE public.content_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  color text DEFAULT '#1B2A4A',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view content_series" ON public.content_series FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create content_series" ON public.content_series FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update content_series" ON public.content_series FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete content_series" ON public.content_series FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- Create content_posts table
CREATE TABLE public.content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  type text DEFAULT 'feed',
  platform text DEFAULT 'instagram',
  status text DEFAULT 'ideia',
  scheduled_date date,
  objective text,
  hook text,
  script text,
  hashtags text[] DEFAULT '{}',
  notes text,
  series_id uuid REFERENCES public.content_series(id) ON DELETE SET NULL,
  target_audience text,
  tone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view content_posts" ON public.content_posts FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create content_posts" ON public.content_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update content_posts" ON public.content_posts FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete content_posts" ON public.content_posts FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- Validation trigger for content_posts type
CREATE OR REPLACE FUNCTION public.validate_content_post()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.type IS NOT NULL AND NEW.type NOT IN ('reels','carrossel','story','feed','live') THEN
    RAISE EXCEPTION 'Tipo inválido: %', NEW.type;
  END IF;
  IF NEW.status IS NOT NULL AND NEW.status NOT IN ('ideia','roteiro','gravando','editando','agendado','publicado') THEN
    RAISE EXCEPTION 'Status inválido: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_content_post_trigger
BEFORE INSERT OR UPDATE ON public.content_posts
FOR EACH ROW EXECUTE FUNCTION public.validate_content_post();
