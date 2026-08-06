-- Fix: erros de edição em leads (site) e cronograma (cenários),
-- + colunas do formulário de contratos que o frontend já envia.
--
-- Contexto (06/08/2026): equipe Quadra reportou falha em qualquer edição
-- em leads e cronograma. Diagnóstico:
-- 1) leads do site (user_id IS NULL) eram visíveis mas NÃO atualizáveis —
--    a migration site_leads só ampliou o SELECT.
-- 2) schedule_scenarios / schedule_scenario_activities usavam RLS
--    "own only" (auth.uid() = user_id), diferente do resto do app que
--    usa get_team_user_ids() — colegas não conseguiam editar cenários.
-- 3) formulário de contratos envia client_*/timeline_*/pdf_url/
--    installments_schedule que nunca foram migrados em produção.

-- ── 1. Leads do site: permitir UPDATE/DELETE pelo time ──────────────
DROP POLICY IF EXISTS "Team can update leads" ON public.leads;
CREATE POLICY "Team can update leads" ON public.leads FOR UPDATE
  USING (
    user_id IN (SELECT get_team_user_ids())
    OR user_id IS NULL
  );

DROP POLICY IF EXISTS "Team can delete leads" ON public.leads;
CREATE POLICY "Team can delete leads" ON public.leads FOR DELETE
  USING (
    user_id IN (SELECT get_team_user_ids())
    OR user_id IS NULL
  );

-- ── 2. Cenários de cronograma: RLS por time ───────────────────────
DROP POLICY IF EXISTS "schedule_scenarios_select_own" ON public.schedule_scenarios;
DROP POLICY IF EXISTS "schedule_scenarios_insert_own" ON public.schedule_scenarios;
DROP POLICY IF EXISTS "schedule_scenarios_update_own" ON public.schedule_scenarios;
DROP POLICY IF EXISTS "schedule_scenarios_delete_own" ON public.schedule_scenarios;

CREATE POLICY "Team can view schedule_scenarios" ON public.schedule_scenarios
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create schedule_scenarios" ON public.schedule_scenarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update schedule_scenarios" ON public.schedule_scenarios
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete schedule_scenarios" ON public.schedule_scenarios
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

DROP POLICY IF EXISTS "schedule_scenario_activities_select_own" ON public.schedule_scenario_activities;
DROP POLICY IF EXISTS "schedule_scenario_activities_insert_own" ON public.schedule_scenario_activities;
DROP POLICY IF EXISTS "schedule_scenario_activities_update_own" ON public.schedule_scenario_activities;
DROP POLICY IF EXISTS "schedule_scenario_activities_delete_own" ON public.schedule_scenario_activities;

CREATE POLICY "Team can view schedule_scenario_activities" ON public.schedule_scenario_activities
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create schedule_scenario_activities" ON public.schedule_scenario_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update schedule_scenario_activities" ON public.schedule_scenario_activities
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete schedule_scenario_activities" ON public.schedule_scenario_activities
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- ── 3. Colunas do formulário de contratos ─────────────────────────
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS client_person_type text,
  ADD COLUMN IF NOT EXISTS client_nationality text,
  ADD COLUMN IF NOT EXISTS client_marital_status text,
  ADD COLUMN IF NOT EXISTS client_rg text,
  ADD COLUMN IF NOT EXISTS client_razao_social text,
  ADD COLUMN IF NOT EXISTS client_tipo_societario text,
  ADD COLUMN IF NOT EXISTS client_representante_legal text,
  ADD COLUMN IF NOT EXISTS client_logradouro text,
  ADD COLUMN IF NOT EXISTS client_numero text,
  ADD COLUMN IF NOT EXISTS client_complemento text,
  ADD COLUMN IF NOT EXISTS client_bairro text,
  ADD COLUMN IF NOT EXISTS client_cidade text,
  ADD COLUMN IF NOT EXISTS client_estado text,
  ADD COLUMN IF NOT EXISTS client_cep text,
  ADD COLUMN IF NOT EXISTS timeline_levantamento integer,
  ADD COLUMN IF NOT EXISTS timeline_briefing integer,
  ADD COLUMN IF NOT EXISTS timeline_anteprojeto integer,
  ADD COLUMN IF NOT EXISTS timeline_anteprojeto_aprovacao integer,
  ADD COLUMN IF NOT EXISTS timeline_projeto_executivo integer,
  ADD COLUMN IF NOT EXISTS timeline_reuniao_prioridades integer,
  ADD COLUMN IF NOT EXISTS timeline_gestao_pagamentos integer,
  ADD COLUMN IF NOT EXISTS installments_schedule jsonb DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
