-- Sprint 6 — cenários "what-if" de cronograma.
-- Permite criar snapshots editáveis das atividades de um projeto,
-- mexer em durações/datas/dependências e comparar com o baseline
-- antes de promover um cenário a definitivo.
--
-- Não reutilizamos a tabela `scenarios` existente porque ela é de
-- cenários de CUSTO (associada a budgets/scenario_items). Aqui é
-- cronograma — domínios diferentes.

CREATE TABLE IF NOT EXISTS public.schedule_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  -- Se true, é a fotografia do cronograma vigente. Mantemos só um
  -- baseline por projeto (impomos no app, não com unique constraint,
  -- para evitar trava em transições).
  is_baseline boolean NOT NULL DEFAULT false,
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_scenarios_project
  ON public.schedule_scenarios(project_id);

CREATE TABLE IF NOT EXISTS public.schedule_scenario_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.schedule_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Referência opcional à atividade original do projeto, para mostrar
  -- "esta veio de" e permitir comparar lado a lado mesmo se o nome
  -- mudar no cenário.
  source_activity_id uuid REFERENCES public.project_activities(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  discipline text,
  area_m2 numeric,
  duration_days integer,
  start_date date,
  end_date date,
  -- Dependências internas ao cenário (IDs de outras schedule_scenario_activities).
  depends_on uuid[],
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_scenario_activities_scenario
  ON public.schedule_scenario_activities(scenario_id);

ALTER TABLE public.schedule_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_scenario_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_scenarios_select_own"
  ON public.schedule_scenarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "schedule_scenarios_insert_own"
  ON public.schedule_scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schedule_scenarios_update_own"
  ON public.schedule_scenarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "schedule_scenarios_delete_own"
  ON public.schedule_scenarios FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "schedule_scenario_activities_select_own"
  ON public.schedule_scenario_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "schedule_scenario_activities_insert_own"
  ON public.schedule_scenario_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "schedule_scenario_activities_update_own"
  ON public.schedule_scenario_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "schedule_scenario_activities_delete_own"
  ON public.schedule_scenario_activities FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_schedule_scenarios_updated_at
  BEFORE UPDATE ON public.schedule_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_scenario_activities_updated_at
  BEFORE UPDATE ON public.schedule_scenario_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
