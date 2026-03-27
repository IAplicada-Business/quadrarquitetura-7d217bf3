
-- 1. material_tracking FK — já existe, verificar se é RESTRICT
-- Se já existe como CASCADE, dropar e recriar
ALTER TABLE public.material_tracking
  DROP CONSTRAINT IF EXISTS fk_material_tracking_project;
ALTER TABLE public.material_tracking
  ADD CONSTRAINT fk_material_tracking_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- 2. material_calculations FK
DELETE FROM public.material_calculations
  WHERE project_id IS NOT NULL
  AND project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.material_calculations
  DROP CONSTRAINT IF EXISTS fk_material_calculations_project;
ALTER TABLE public.material_calculations
  ADD CONSTRAINT fk_material_calculations_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- 3. calculation_parameters INSERT → admin only
DROP POLICY IF EXISTS "Authenticated can insert calculation_parameters" ON public.calculation_parameters;
DROP POLICY IF EXISTS "calculation_parameters_insert" ON public.calculation_parameters;
CREATE POLICY "calculation_parameters_insert" ON public.calculation_parameters
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. default_disciplines INSERT → admin only
DROP POLICY IF EXISTS "Authenticated can insert default_disciplines" ON public.default_disciplines;
DROP POLICY IF EXISTS "default_disciplines_insert" ON public.default_disciplines;
CREATE POLICY "default_disciplines_insert" ON public.default_disciplines
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
