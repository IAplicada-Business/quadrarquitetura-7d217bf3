-- Allow anonymous inserts from the LP contact form.
-- user_id becomes nullable so site leads (no auth context) can be stored.
-- Team members see all leads including site ones (user_id IS NULL).

ALTER TABLE public.leads ALTER COLUMN user_id DROP NOT NULL;

-- Allow anonymous users to insert site leads
CREATE POLICY "Anon site leads insert" ON public.leads
  FOR INSERT TO anon
  WITH CHECK (origin = 'site' AND user_id IS NULL);

-- Update team view policy to also surface site leads (user_id IS NULL)
DROP POLICY IF EXISTS "Team can view leads" ON public.leads;
CREATE POLICY "Team can view leads" ON public.leads FOR SELECT
  USING (
    user_id IN (SELECT get_team_user_ids())
    OR user_id IS NULL
  );
