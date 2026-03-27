-- budget_quote_items → budget_quotes: CASCADE → RESTRICT
ALTER TABLE public.budget_quote_items
  DROP CONSTRAINT budget_quote_items_budget_quote_id_fkey;
ALTER TABLE public.budget_quote_items
  ADD CONSTRAINT fk_budget_quote_items_quote
  FOREIGN KEY (budget_quote_id) REFERENCES public.budget_quotes(id) ON DELETE RESTRICT;

-- discipline_priorities → projects: CASCADE → RESTRICT
ALTER TABLE public.discipline_priorities
  DROP CONSTRAINT discipline_priorities_project_id_fkey;
ALTER TABLE public.discipline_priorities
  ADD CONSTRAINT fk_discipline_priorities_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- discipline_priorities → scope_items: CASCADE → RESTRICT
ALTER TABLE public.discipline_priorities
  DROP CONSTRAINT discipline_priorities_scope_item_id_fkey;
ALTER TABLE public.discipline_priorities
  ADD CONSTRAINT fk_discipline_priorities_scope_item
  FOREIGN KEY (scope_item_id) REFERENCES public.scope_items(id) ON DELETE RESTRICT;