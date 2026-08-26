-- Separa o funil comercial (B2B/B2C) do pipeline de arquitetos
-- parceiros, reaproveitando a MESMA tabela leads (sem duplicar
-- schema) — só adicionando um discriminador de tipo. Todo lead
-- existente é comercial (é o que já rodava até aqui).

CREATE TYPE public.lead_type AS ENUM ('comercial', 'parceiro');

ALTER TABLE public.leads
  ADD COLUMN lead_type public.lead_type NOT NULL DEFAULT 'comercial';

CREATE INDEX idx_leads_lead_type ON public.leads(lead_type);

NOTIFY pgrst, 'reload schema';
