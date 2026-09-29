-- see file supabase/migrations/20260929150000_client_onboarding.sql
CREATE TABLE public.onboarding_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL DEFAULT public.get_my_team_id(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Template padrão',
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX onboarding_templates_one_default_per_team ON public.onboarding_templates(team_id) WHERE is_default;
CREATE TABLE public.onboarding_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL DEFAULT public.get_my_team_id(),
  user_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  video_url text,
  image_urls text[] NOT NULL DEFAULT '{}',
  cta_label text,
  cta_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_onboarding_sections_template ON public.onboarding_sections(template_id, display_order);
CREATE TABLE public.onboarding_project_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL DEFAULT public.get_my_team_id(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_template_id uuid REFERENCES public.onboarding_templates(id) ON DELETE SET NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sections_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_project_overrides_project_unique UNIQUE (project_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_templates, public.onboarding_sections, public.onboarding_project_overrides TO authenticated;
GRANT ALL ON public.onboarding_templates, public.onboarding_sections, public.onboarding_project_overrides TO service_role;
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_project_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view onboarding_templates" ON public.onboarding_templates FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can create onboarding_templates" ON public.onboarding_templates FOR INSERT WITH CHECK (auth.uid() = user_id AND team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can update onboarding_templates" ON public.onboarding_templates FOR UPDATE USING (team_id IN (SELECT public.get_my_team_ids())) WITH CHECK (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can delete onboarding_templates" ON public.onboarding_templates FOR DELETE USING (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can view onboarding_sections" ON public.onboarding_sections FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can create onboarding_sections" ON public.onboarding_sections FOR INSERT WITH CHECK (auth.uid() = user_id AND team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can update onboarding_sections" ON public.onboarding_sections FOR UPDATE USING (team_id IN (SELECT public.get_my_team_ids())) WITH CHECK (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can delete onboarding_sections" ON public.onboarding_sections FOR DELETE USING (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can view onboarding_project_overrides" ON public.onboarding_project_overrides FOR SELECT USING (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can create onboarding_project_overrides" ON public.onboarding_project_overrides FOR INSERT WITH CHECK (auth.uid() = user_id AND team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can update onboarding_project_overrides" ON public.onboarding_project_overrides FOR UPDATE USING (team_id IN (SELECT public.get_my_team_ids())) WITH CHECK (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can delete onboarding_project_overrides" ON public.onboarding_project_overrides FOR DELETE USING (team_id IN (SELECT public.get_my_team_ids()));
CREATE TRIGGER update_onboarding_templates_updated_at BEFORE UPDATE ON public.onboarding_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_onboarding_sections_updated_at BEFORE UPDATE ON public.onboarding_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_onboarding_project_overrides_updated_at BEFORE UPDATE ON public.onboarding_project_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "Authenticated users can upload onboarding media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'onboarding-media');
CREATE POLICY "Anyone can view onboarding media" ON storage.objects FOR SELECT USING (bucket_id = 'onboarding-media');
CREATE POLICY "Authenticated users can update onboarding media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'onboarding-media');
CREATE POLICY "Authenticated users can delete onboarding media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'onboarding-media');
NOTIFY pgrst, 'reload schema';