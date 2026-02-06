
-- =============================================
-- FASE 1: Migração completa - Módulo de Orçamentos e Gestão de Obra
-- =============================================

-- 1. NOVAS TABELAS
-- =============================================

-- scope_items - Disciplinas do escopo da obra
CREATE TABLE public.scope_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  description TEXT,
  suppliers_to_quote TEXT,
  payment_terms TEXT,
  entry_order INTEGER,
  service_duration TEXT,
  parent_id UUID REFERENCES public.scope_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scope_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scope_items" ON public.scope_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create scope_items" ON public.scope_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scope_items" ON public.scope_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scope_items" ON public.scope_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_scope_items_updated_at BEFORE UPDATE ON public.scope_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- budget_quotes - Orçamentos por disciplina/fornecedor
CREATE TABLE public.budget_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES public.scope_items(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  services_description TEXT,
  value NUMERIC,
  material_estimate NUMERIC,
  delivery_time TEXT,
  payment_terms TEXT,
  status budget_status DEFAULT 'pendente',
  revision TEXT DEFAULT 'Rev 1',
  revision_number INTEGER DEFAULT 1,
  is_current_revision BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget_quotes" ON public.budget_quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create budget_quotes" ON public.budget_quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget_quotes" ON public.budget_quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budget_quotes" ON public.budget_quotes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_budget_quotes_updated_at BEFORE UPDATE ON public.budget_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- material_calculations - Memória de cálculo
CREATE TABLE public.material_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  unit TEXT,
  quantity NUMERIC,
  parameters JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  linked_purchase_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.material_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own material_calculations" ON public.material_calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create material_calculations" ON public.material_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own material_calculations" ON public.material_calculations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own material_calculations" ON public.material_calculations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_material_calculations_updated_at BEFORE UPDATE ON public.material_calculations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- material_tracking - Rastreamento de materiais
CREATE TABLE public.material_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  quantity_needed NUMERIC,
  quantity_purchased NUMERIC DEFAULT 0,
  quantity_delivered NUMERIC DEFAULT 0,
  quantity_used NUMERIC DEFAULT 0,
  purchase_date DATE,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.material_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own material_tracking" ON public.material_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create material_tracking" ON public.material_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own material_tracking" ON public.material_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own material_tracking" ON public.material_tracking FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_material_tracking_updated_at BEFORE UPDATE ON public.material_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- invoices - Notas fiscais
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_number TEXT,
  store_name TEXT,
  category TEXT,
  value NUMERIC,
  file_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- schedule_tasks - Cronograma de obra
CREATE TABLE public.schedule_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scope_item_id UUID REFERENCES public.scope_items(id) ON DELETE SET NULL,
  task_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planejado',
  payment_note TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own schedule_tasks" ON public.schedule_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create schedule_tasks" ON public.schedule_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule_tasks" ON public.schedule_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule_tasks" ON public.schedule_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_schedule_tasks_updated_at BEFORE UPDATE ON public.schedule_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- pending_items - Lista de pendências
CREATE TABLE public.pending_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  discipline TEXT,
  description TEXT NOT NULL,
  responsible TEXT,
  status TEXT DEFAULT 'pendente',
  inclusion_date DATE DEFAULT CURRENT_DATE,
  conclusion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending_items" ON public.pending_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create pending_items" ON public.pending_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending_items" ON public.pending_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pending_items" ON public.pending_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pending_items_updated_at BEFORE UPDATE ON public.pending_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. ALTERAÇÕES EM TABELAS EXISTENTES
-- =============================================

-- purchases - novas colunas
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS payment_info TEXT;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS specifications TEXT;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS material_calc_id UUID REFERENCES public.material_calculations(id) ON DELETE SET NULL;

-- payments - novas colunas
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS budget_quote_id UUID REFERENCES public.budget_quotes(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS installment_number INTEGER;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS total_installments INTEGER;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS paid_date DATE;

-- 3. STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);

CREATE POLICY "Users can upload project files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view project files" ON storage.objects FOR SELECT USING (bucket_id = 'project-files');
CREATE POLICY "Users can update own project files" ON storage.objects FOR UPDATE USING (bucket_id = 'project-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own project files" ON storage.objects FOR DELETE USING (bucket_id = 'project-files' AND auth.uid() IS NOT NULL);
