
-- =============================================
-- Fase 1: Novas tabelas e colunas
-- =============================================

-- 1.1 proposal_templates
CREATE TABLE public.proposal_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  template_type text DEFAULT 'residencial',
  introduction text,
  methodology text,
  differentials text,
  terms text,
  footer text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own proposal_templates" ON public.proposal_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create proposal_templates" ON public.proposal_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own proposal_templates" ON public.proposal_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own proposal_templates" ON public.proposal_templates FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_proposal_templates_updated_at BEFORE UPDATE ON public.proposal_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1.1 contract_templates
CREATE TABLE public.contract_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  contract_type text DEFAULT 'projeto_acompanhamento',
  clause_object text,
  clause_scope text,
  clause_value text,
  clause_duration text,
  clause_obligations_contractor text,
  clause_obligations_client text,
  clause_termination text,
  clause_confidentiality text,
  clause_general text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own contract_templates" ON public.contract_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create contract_templates" ON public.contract_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contract_templates" ON public.contract_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own contract_templates" ON public.contract_templates FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1.1 lead_form_submissions
CREATE TABLE public.lead_form_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  project_type text DEFAULT 'residencial',
  message text,
  processed boolean DEFAULT false,
  generated_lead_id uuid REFERENCES public.leads(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit lead form" ON public.lead_form_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view submissions" ON public.lead_form_submissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update submissions" ON public.lead_form_submissions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 1.2 Colunas novas em leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS construction_type text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_detail text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_reason text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at timestamptz;

-- 1.3 Colunas novas em proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS proposal_number text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS project_type text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS estimated_area numeric;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS estimated_duration text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS includes_architectural_project boolean DEFAULT true;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS includes_construction_management boolean DEFAULT true;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS includes_interior_design boolean DEFAULT false;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS includes_3d_visualization boolean DEFAULT false;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS custom_services text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS discount_value numeric;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS final_value numeric;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS notes text;

-- Add template_id FK after table exists
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.proposal_templates(id);

-- 1.4 Colunas novas em contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS contract_number text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_cpf_cnpj text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_phone text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS client_address text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS construction_neighborhood text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS service_description text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS estimated_duration text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS custom_clauses text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_at timestamptz;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.contract_templates(id);
