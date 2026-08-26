-- Estágios do pipeline de parceiros — independente do `status` do
-- funil comercial. Fica NULL pra leads comerciais; a constraint
-- garante essa consistência no banco, não só na aplicação.

CREATE TYPE public.partner_stage AS ENUM (
  'novo',
  'primeira_conversa',
  'parceria_ativa',
  'trouxe_indicacao',
  'fidelizado',
  'inativo'
);

ALTER TABLE public.leads
  ADD COLUMN partner_stage public.partner_stage;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_partner_stage_consistency CHECK (
    (lead_type = 'parceiro' AND partner_stage IS NOT NULL) OR
    (lead_type = 'comercial' AND partner_stage IS NULL)
  );

NOTIFY pgrst, 'reload schema';
