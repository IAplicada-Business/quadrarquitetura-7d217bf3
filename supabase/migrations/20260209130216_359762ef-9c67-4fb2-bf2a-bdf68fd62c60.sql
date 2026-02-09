-- 1. Create default_disciplines table
CREATE TABLE public.default_disciplines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create calculation_parameters table
CREATE TABLE public.calculation_parameters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  parameter_key text NOT NULL,
  parameter_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  unit text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create supplier_allocations table
CREATE TABLE public.supplier_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  discipline text NOT NULL,
  start_date date,
  end_date date,
  status text DEFAULT 'ativo',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- 4. Create site_visits table
CREATE TABLE public.site_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  visit_date timestamptz NOT NULL,
  visit_type text NOT NULL, -- 'vistoria', 'medicao', 'entrega', 'reuniao'
  notes text,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- 5. Add columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS ideal_budget numeric;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contingency_percentage numeric DEFAULT 5;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS real_start_date date;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS notes text;

-- 6. Add columns to scope_items
ALTER TABLE public.scope_items ADD COLUMN IF NOT EXISTS scope_type text DEFAULT 'projeto'; -- 'projeto' or 'contratado'
ALTER TABLE public.scope_items ADD COLUMN IF NOT EXISTS activities text; -- newline separated list

-- 7. Add columns to schedule_tasks
ALTER TABLE public.schedule_tasks ADD COLUMN IF NOT EXISTS discipline text;
ALTER TABLE public.schedule_tasks ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE public.schedule_tasks ADD COLUMN IF NOT EXISTS is_daily_detail boolean DEFAULT false;
ALTER TABLE public.schedule_tasks ADD COLUMN IF NOT EXISTS is_client_visible boolean DEFAULT true;
ALTER TABLE public.schedule_tasks ADD COLUMN IF NOT EXISTS requires_presence boolean DEFAULT false;
ALTER TABLE public.schedule_tasks ADD COLUMN IF NOT EXISTS progress_percentage numeric DEFAULT 0;
ALTER TABLE public.schedule_tasks ADD COLUMN IF NOT EXISTS color text;

-- 8. Add columns to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS type text DEFAULT 'compra'; -- 'compra' or 'deposito'
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS receipt_image_url text;

-- 9. Add columns to suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 10. Add columns to documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS uploaded_by uuid;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS notes text;

-- 11. Add columns to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method text;

-- 12. Enable RLS
ALTER TABLE public.default_disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS policies
-- default_disciplines: viewable by all authenticated, editable by admin (or just authenticated for simplicity now)
CREATE POLICY "Authenticated can view default_disciplines" ON public.default_disciplines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert default_disciplines" ON public.default_disciplines FOR INSERT TO authenticated WITH CHECK (true); -- simplified

-- calculation_parameters: viewable by all, editable by authenticated
CREATE POLICY "Authenticated can view calculation_parameters" ON public.calculation_parameters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert calculation_parameters" ON public.calculation_parameters FOR INSERT TO authenticated WITH CHECK (true);

-- supplier_allocations: owner access
CREATE POLICY "Users can view own allocations" ON public.supplier_allocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own allocations" ON public.supplier_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own allocations" ON public.supplier_allocations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own allocations" ON public.supplier_allocations FOR DELETE USING (auth.uid() = user_id);

-- site_visits: owner access
CREATE POLICY "Users can view own site_visits" ON public.site_visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own site_visits" ON public.site_visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own site_visits" ON public.site_visits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own site_visits" ON public.site_visits FOR DELETE USING (auth.uid() = user_id);

-- 14. Add triggers for updated_at
CREATE TRIGGER update_default_disciplines_updated_at BEFORE UPDATE ON public.default_disciplines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calculation_parameters_updated_at BEFORE UPDATE ON public.calculation_parameters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_allocations_updated_at BEFORE UPDATE ON public.supplier_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_visits_updated_at BEFORE UPDATE ON public.site_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Seed default data (disciplines)
INSERT INTO public.default_disciplines (name, display_order) VALUES
('Serviços Preliminares', 1),
('Demolições e Retiradas', 2),
('Alvenarias e Fechamentos', 3),
('Estrutura e Reforços', 4),
('Instalações Elétricas', 5),
('Instalações Hidráulicas', 6),
('Impermeabilização', 7),
('Contrapiso e Revestimentos', 8),
('Forros e Gesso', 9),
('Pintura', 10),
('Marmoraria e Granitos', 11),
('Serralheria e Vidros', 12),
('Marcenaria', 13),
('Louças e Metais', 14),
('Iluminação', 15),
('Limpeza e Entrega', 16);

-- 16. Seed default calculation parameters
INSERT INTO public.calculation_parameters (category, parameter_key, parameter_value, unit, description) VALUES
('Alvenaria', 'tijolo_baiano', '{"consumo_m2": 25, "perda": 0.1}'::jsonb, 'un', 'Tijolo Baiano 14x19x29'),
('Alvenaria', 'bloco_concreto', '{"consumo_m2": 12.5, "perda": 0.05}'::jsonb, 'un', 'Bloco de Concreto 14x19x39'),
('Argamassa', 'assentamento', '{"consumo_m2": 15, "perda": 0.1}'::jsonb, 'kg', 'Argamassa para assentamento'),
('Reboco', 'interno', '{"consumo_m2": 20, "espessura_mm": 20, "perda": 0.1}'::jsonb, 'kg', 'Reboco interno 2cm'),
('Pintura', 'tinta_acrilica', '{"rendimento_l_m2": 10, "demaos": 2, "perda": 0.1}'::jsonb, 'l', 'Tinta Acrílica Fosca'),
('Eletrica', 'pontos', '{"fio_m_ponto": 15, "eletroduto_m_ponto": 5}'::jsonb, 'm', 'Média por ponto elétrico');
