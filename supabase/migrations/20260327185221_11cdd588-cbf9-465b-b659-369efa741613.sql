
-- budget_quotes: drop existing CASCADE FK, add RESTRICT
DELETE FROM public.budget_quotes WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.budget_quotes DROP CONSTRAINT IF EXISTS budget_quotes_project_id_fkey;
ALTER TABLE public.budget_quotes ADD CONSTRAINT fk_budget_quotes_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- invoices: drop existing CASCADE FK, add RESTRICT
DELETE FROM public.invoices WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- pending_items: drop existing CASCADE FK, add RESTRICT
DELETE FROM public.pending_items WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.pending_items DROP CONSTRAINT IF EXISTS pending_items_project_id_fkey;
ALTER TABLE public.pending_items ADD CONSTRAINT fk_pending_items_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- purchases: drop existing CASCADE FK, add RESTRICT
DELETE FROM public.purchases WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_project_id_fkey;
ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- scenarios: add RESTRICT (no existing FK)
DELETE FROM public.scenarios WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.scenarios DROP CONSTRAINT IF EXISTS scenarios_project_id_fkey;
ALTER TABLE public.scenarios ADD CONSTRAINT fk_scenarios_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- site_diary_entries: add RESTRICT
DELETE FROM public.site_diary_entries WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.site_diary_entries DROP CONSTRAINT IF EXISTS site_diary_entries_project_id_fkey;
ALTER TABLE public.site_diary_entries ADD CONSTRAINT fk_site_diary_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- voice_tasks: add RESTRICT
DELETE FROM public.voice_tasks WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.voice_tasks DROP CONSTRAINT IF EXISTS voice_tasks_project_id_fkey;
ALTER TABLE public.voice_tasks ADD CONSTRAINT fk_voice_tasks_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;
