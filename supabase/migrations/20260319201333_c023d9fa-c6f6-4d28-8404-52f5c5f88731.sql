CREATE OR REPLACE FUNCTION public.check_scope_status_irreversible()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  status_order text[] := ARRAY['rascunho','planejado','em_cotacao','contratado','em_execucao','executado'];
  old_idx int;
  new_idx int;
BEGIN
  old_idx := array_position(status_order, OLD.status);
  new_idx := array_position(status_order, NEW.status);
  IF old_idx >= 4 AND new_idx < old_idx THEN
    RAISE EXCEPTION 'Status não pode ser revertido após Contratado';
  END IF;
  RETURN NEW;
END;
$$;