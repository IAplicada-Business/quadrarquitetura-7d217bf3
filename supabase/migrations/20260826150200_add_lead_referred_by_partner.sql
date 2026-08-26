-- Fecha o loop de indicações: um lead comercial pode registrar qual
-- parceiro o indicou. FK auto-referencial e opcional — só é
-- preenchida quando o canal de aquisição do lead é um canal marcado
-- como "de parceria" (ver migration is_partner_channel).
--
-- Um FK comum não consegue garantir "só aponta pra um lead do tipo
-- parceiro" nem "só é setado em lead comercial" (isso depende da
-- LINHA referenciada, não só do tipo, então uma CHECK simples não
-- basta) — por isso o trigger abaixo.

ALTER TABLE public.leads
  ADD COLUMN referred_by_partner_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE INDEX idx_leads_referred_by_partner_id ON public.leads(referred_by_partner_id);

CREATE OR REPLACE FUNCTION public.validate_lead_referral()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  partner_type public.lead_type;
BEGIN
  IF NEW.referred_by_partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.referred_by_partner_id = NEW.id THEN
    RAISE EXCEPTION 'Um lead não pode se auto-referenciar como parceiro indicador';
  END IF;

  IF NEW.lead_type <> 'comercial' THEN
    RAISE EXCEPTION 'referred_by_partner_id só é válido em leads comerciais';
  END IF;

  SELECT lead_type INTO partner_type FROM public.leads WHERE id = NEW.referred_by_partner_id;
  IF partner_type IS DISTINCT FROM 'parceiro' THEN
    RAISE EXCEPTION 'referred_by_partner_id precisa apontar para um lead do tipo parceiro';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_lead_referral_trigger
  BEFORE INSERT OR UPDATE OF referred_by_partner_id, lead_type ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_lead_referral();

NOTIFY pgrst, 'reload schema';
