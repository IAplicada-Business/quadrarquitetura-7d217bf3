ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE RESTRICT;

UPDATE public.contracts c
SET lead_id = p.lead_id
FROM public.proposals p
WHERE c.proposal_id = p.id
AND c.lead_id IS NULL;