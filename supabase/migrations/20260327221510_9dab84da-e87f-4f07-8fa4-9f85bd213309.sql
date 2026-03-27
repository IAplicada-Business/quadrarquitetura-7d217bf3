DROP TRIGGER IF EXISTS trg_scope_status_irreversible ON public.scope_items;
CREATE TRIGGER trg_scope_status_irreversible
  BEFORE UPDATE ON public.scope_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_scope_status_irreversible();