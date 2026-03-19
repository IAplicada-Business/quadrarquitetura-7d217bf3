
CREATE TABLE public.calculation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  discipline text NOT NULL,
  variable_name text NOT NULL,
  formula text NOT NULL,
  result_name text NOT NULL,
  unit text NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calculation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rules" ON public.calculation_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON public.calculation_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.calculation_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.calculation_rules FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_calculation_rules_updated_at
  BEFORE UPDATE ON public.calculation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
