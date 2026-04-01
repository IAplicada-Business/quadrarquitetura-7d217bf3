ALTER TABLE supplier_allocations
  ADD COLUMN IF NOT EXISTS contracted_value numeric,
  ADD COLUMN IF NOT EXISTS final_value numeric,
  ADD COLUMN IF NOT EXISTS rating integer;

CREATE OR REPLACE FUNCTION public.validate_supplier_allocation_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'Rating deve ser entre 1 e 5';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_supplier_allocation_rating ON supplier_allocations;

CREATE TRIGGER trg_validate_supplier_allocation_rating
  BEFORE INSERT OR UPDATE ON supplier_allocations
  FOR EACH ROW EXECUTE FUNCTION validate_supplier_allocation_rating();