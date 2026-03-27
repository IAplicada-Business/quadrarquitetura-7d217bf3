
-- Tabela de equipes
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler membros do próprio time
CREATE POLICY "Users can view own team" ON public.team_members
  FOR SELECT TO authenticated
  USING (team_id IN (SELECT tm.team_id FROM public.team_members tm WHERE tm.user_id = auth.uid()));

-- Admins podem inserir
CREATE POLICY "Admins can insert team_members" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins podem deletar
CREATE POLICY "Admins can delete team_members" ON public.team_members
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Função auxiliar: retorna todos os user_ids do time do caller
CREATE OR REPLACE FUNCTION public.get_team_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm2.user_id
  FROM team_members tm1
  JOIN team_members tm2 ON tm1.team_id = tm2.team_id
  WHERE tm1.user_id = auth.uid()
$$;

-- Atualizar RLS: LEADS
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;

CREATE POLICY "Team can view leads" ON public.leads FOR SELECT
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create leads" ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update leads" ON public.leads FOR UPDATE
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete leads" ON public.leads FOR DELETE
  USING (user_id IN (SELECT get_team_user_ids()));

-- Atualizar RLS: PROPOSALS
DROP POLICY IF EXISTS "Users can view own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete own proposals" ON public.proposals;

CREATE POLICY "Team can view proposals" ON public.proposals FOR SELECT
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create proposals" ON public.proposals FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update proposals" ON public.proposals FOR UPDATE
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete proposals" ON public.proposals FOR DELETE
  USING (user_id IN (SELECT get_team_user_ids()));

-- Atualizar RLS: CONTRACTS
DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.contracts;

CREATE POLICY "Team can view contracts" ON public.contracts FOR SELECT
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create contracts" ON public.contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update contracts" ON public.contracts FOR UPDATE
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete contracts" ON public.contracts FOR DELETE
  USING (user_id IN (SELECT get_team_user_ids()));

-- Atualizar RLS: PROJECTS
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Team can view projects" ON public.projects FOR SELECT
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create projects" ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update projects" ON public.projects FOR UPDATE
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete projects" ON public.projects FOR DELETE
  USING (user_id IN (SELECT get_team_user_ids()));

-- Seed: inserir admins existentes no mesmo time
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  ur.user_id,
  'admin'
FROM public.user_roles ur
WHERE ur.role = 'admin'
ON CONFLICT (team_id, user_id) DO NOTHING;
