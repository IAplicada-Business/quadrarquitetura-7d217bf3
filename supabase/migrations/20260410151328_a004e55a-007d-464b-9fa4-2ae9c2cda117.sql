CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'whatsapp' CHECK (type IN ('whatsapp','email')),
  category text CHECK (category IN ('lead','proposta','contrato','obra','financeiro','geral')),
  body text NOT NULL,
  variables text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view message_templates" ON public.message_templates
  FOR SELECT TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create message_templates" ON public.message_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update message_templates" ON public.message_templates
  FOR UPDATE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete message_templates" ON public.message_templates
  FOR DELETE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));