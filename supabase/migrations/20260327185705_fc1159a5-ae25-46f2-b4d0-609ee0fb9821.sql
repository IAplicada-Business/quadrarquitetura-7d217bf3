
-- reports → projects: CASCADE → RESTRICT
DELETE FROM public.reports WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.reports DROP CONSTRAINT reports_project_id_fkey;
ALTER TABLE public.reports ADD CONSTRAINT fk_reports_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- documents → projects: CASCADE → RESTRICT
DELETE FROM public.documents WHERE project_id IS NOT NULL AND project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.documents DROP CONSTRAINT documents_project_id_fkey;
ALTER TABLE public.documents ADD CONSTRAINT fk_documents_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- site_visits → projects: CASCADE → RESTRICT
DELETE FROM public.site_visits WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.site_visits DROP CONSTRAINT site_visits_project_id_fkey;
ALTER TABLE public.site_visits ADD CONSTRAINT fk_site_visits_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- supplier_allocations → suppliers: CASCADE → RESTRICT
DELETE FROM public.supplier_allocations WHERE supplier_id NOT IN (SELECT id FROM public.suppliers);
ALTER TABLE public.supplier_allocations DROP CONSTRAINT supplier_allocations_supplier_id_fkey;
ALTER TABLE public.supplier_allocations ADD CONSTRAINT fk_supplier_allocations_supplier
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;
