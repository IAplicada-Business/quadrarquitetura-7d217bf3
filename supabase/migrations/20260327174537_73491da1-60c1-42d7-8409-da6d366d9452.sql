-- 1. proposals.lead_id: CASCADE → RESTRICT
ALTER TABLE public.proposals
  DROP CONSTRAINT IF EXISTS proposals_lead_id_fkey,
  ADD CONSTRAINT proposals_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.leads(id)
    ON DELETE RESTRICT;

-- 2. contracts.proposal_id: CASCADE → RESTRICT
ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_proposal_id_fkey,
  ADD CONSTRAINT contracts_proposal_id_fkey
    FOREIGN KEY (proposal_id) REFERENCES public.proposals(id)
    ON DELETE RESTRICT;