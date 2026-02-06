
-- =============================================
-- Rodada 1: New tables for Materiais, Compras, Pendências, Financeiro, Cronograma
-- =============================================

-- Table: budget_quote_items (line items per vendor quote)
CREATE TABLE public.budget_quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  budget_quote_id UUID NOT NULL REFERENCES public.budget_quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budget_quote_items" ON public.budget_quote_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create budget_quote_items" ON public.budget_quote_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget_quote_items" ON public.budget_quote_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budget_quote_items" ON public.budget_quote_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_budget_quote_items_updated_at
  BEFORE UPDATE ON public.budget_quote_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: discipline_material_estimates (material estimate per discipline, not per quote)
CREATE TABLE public.discipline_material_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scope_item_id UUID NOT NULL REFERENCES public.scope_items(id) ON DELETE CASCADE,
  description TEXT,
  value NUMERIC DEFAULT 0,
  revision_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discipline_material_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discipline_material_estimates" ON public.discipline_material_estimates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create discipline_material_estimates" ON public.discipline_material_estimates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discipline_material_estimates" ON public.discipline_material_estimates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own discipline_material_estimates" ON public.discipline_material_estimates FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_discipline_material_estimates_updated_at
  BEFORE UPDATE ON public.discipline_material_estimates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: discipline_priorities (priority ordering for budget meeting)
CREATE TABLE public.discipline_priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scope_item_id UUID NOT NULL REFERENCES public.scope_items(id) ON DELETE CASCADE,
  priority INTEGER,
  is_prioritized BOOLEAN DEFAULT true,
  revision_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discipline_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discipline_priorities" ON public.discipline_priorities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create discipline_priorities" ON public.discipline_priorities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discipline_priorities" ON public.discipline_priorities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own discipline_priorities" ON public.discipline_priorities FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_discipline_priorities_updated_at
  BEFORE UPDATE ON public.discipline_priorities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
