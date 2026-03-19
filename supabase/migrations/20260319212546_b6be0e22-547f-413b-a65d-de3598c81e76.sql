
CREATE TABLE public.client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.client_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can insert tokens" ON public.client_portal_tokens
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view tokens" ON public.client_portal_tokens
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update tokens" ON public.client_portal_tokens
  FOR UPDATE TO authenticated USING (true);
