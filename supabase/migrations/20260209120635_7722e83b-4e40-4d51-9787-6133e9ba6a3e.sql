
-- =============================================
-- FASE 1: Criar 5 tabelas novas + colunas extras
-- =============================================

-- 1. LEADS
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  phone_secondary text,
  project_type public.client_type NOT NULL DEFAULT 'residencial',
  origin public.client_origin NOT NULL DEFAULT 'outro',
  responsible text,
  notes text,
  status text NOT NULL DEFAULT 'novo',
  meeting_date date,
  converted_client_id uuid REFERENCES public.clients(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. PROPOSALS
CREATE TABLE public.proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  project_description text,
  value numeric,
  discount_percent numeric,
  payment_conditions text,
  deadline text,
  template_name text,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposals" ON public.proposals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own proposals" ON public.proposals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own proposals" ON public.proposals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. CONTRACTS
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id),
  template_name text,
  clauses text,
  address text,
  city text,
  value numeric,
  payment_conditions text,
  start_date date,
  status text NOT NULL DEFAULT 'rascunho',
  project_id uuid REFERENCES public.projects(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts" ON public.contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contracts" ON public.contracts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. SCENARIOS
CREATE TABLE public.scenarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_value numeric DEFAULT 0,
  is_approved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scenarios" ON public.scenarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create scenarios" ON public.scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenarios" ON public.scenarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenarios" ON public.scenarios FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. SCENARIO_ITEMS
CREATE TABLE public.scenario_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  discipline text NOT NULL,
  description text,
  estimated_value numeric DEFAULT 0,
  is_included boolean DEFAULT true,
  display_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scenario_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scenario_items" ON public.scenario_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create scenario_items" ON public.scenario_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenario_items" ON public.scenario_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenario_items" ON public.scenario_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_scenario_items_updated_at BEFORE UPDATE ON public.scenario_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. COLUNAS NOVAS EM PROJECTS
ALTER TABLE public.projects ADD COLUMN contract_id uuid REFERENCES public.contracts(id);
ALTER TABLE public.projects ADD COLUMN approved_scenario_id uuid REFERENCES public.scenarios(id);
ALTER TABLE public.projects ADD COLUMN client_budget numeric;

-- 7. COLUNA NOVA EM SCOPE_ITEMS
ALTER TABLE public.scope_items ADD COLUMN estimated_value numeric;
