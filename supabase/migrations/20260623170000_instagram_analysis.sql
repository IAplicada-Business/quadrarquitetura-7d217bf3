-- Sprint 4d (item 15b) — Análise comparativa de Instagrams.
-- Mariana (vídeo 15): "ficou faltando aquele ponto onde você faria
-- análise comparando os Instagrams que a gente mandou pra você".
--
-- Schema simples: cada perfil monitorado é uma linha em
-- `instagram_profiles`. Métricas vêm como séries históricas em
-- `instagram_metrics` (uma linha por período — geralmente mês).
-- Tudo é input manual pela Quadra (sem integração com API do IG).

CREATE TABLE IF NOT EXISTS public.instagram_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text NOT NULL,
  label text,
  -- A própria Quadra ou concorrente / referência. Default 'reference'.
  kind text NOT NULL DEFAULT 'reference' CHECK (kind IN ('self', 'reference')),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_profiles_user
  ON public.instagram_profiles(user_id);

CREATE TABLE IF NOT EXISTS public.instagram_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.instagram_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Janela coberta pelas métricas (geralmente um mês cheio).
  period_start date NOT NULL,
  period_end date NOT NULL,
  -- Métricas comparáveis. Tudo opcional para permitir preenchimento
  -- incremental sem travar o cadastro.
  followers integer,
  post_count integer,
  reel_count integer,
  story_count integer,
  avg_likes numeric,
  avg_comments numeric,
  avg_reach numeric,
  avg_saves numeric,
  engagement_rate numeric,
  -- Paleta dominante (até 4 cores) como texto livre (#RRGGBB ou nome).
  palette_dominant text,
  palette_secondary text,
  palette_tertiary text,
  palette_quaternary text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instagram_metrics_profile_period
  ON public.instagram_metrics(profile_id, period_start);

ALTER TABLE public.instagram_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instagram_profiles_select_own"
  ON public.instagram_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "instagram_profiles_insert_own"
  ON public.instagram_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "instagram_profiles_update_own"
  ON public.instagram_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "instagram_profiles_delete_own"
  ON public.instagram_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "instagram_metrics_select_own"
  ON public.instagram_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "instagram_metrics_insert_own"
  ON public.instagram_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "instagram_metrics_update_own"
  ON public.instagram_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "instagram_metrics_delete_own"
  ON public.instagram_metrics FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_instagram_profiles_updated_at
  BEFORE UPDATE ON public.instagram_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instagram_metrics_updated_at
  BEFORE UPDATE ON public.instagram_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
