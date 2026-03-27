-- scope_items
ALTER TABLE public.scope_items DROP CONSTRAINT IF EXISTS scope_items_project_id_fkey;
ALTER TABLE public.scope_items ADD CONSTRAINT fk_scope_items_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- schedule_tasks
ALTER TABLE public.schedule_tasks DROP CONSTRAINT IF EXISTS schedule_tasks_project_id_fkey;
ALTER TABLE public.schedule_tasks ADD CONSTRAINT fk_schedule_tasks_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- budgets
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_project_id_fkey;
ALTER TABLE public.budgets ADD CONSTRAINT fk_budgets_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- payments
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_project_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT fk_payments_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- material_tracking
ALTER TABLE public.material_tracking DROP CONSTRAINT IF EXISTS material_tracking_project_id_fkey;
ALTER TABLE public.material_tracking ADD CONSTRAINT fk_material_tracking_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- site_tracking
ALTER TABLE public.site_tracking DROP CONSTRAINT IF EXISTS site_tracking_project_id_fkey;
ALTER TABLE public.site_tracking ADD CONSTRAINT fk_site_tracking_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- supplier_allocations
ALTER TABLE public.supplier_allocations DROP CONSTRAINT IF EXISTS supplier_allocations_project_id_fkey;
ALTER TABLE public.supplier_allocations ADD CONSTRAINT fk_supplier_allocations_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;