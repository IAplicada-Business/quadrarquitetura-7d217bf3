-- Sprint 4b — refactor do form de NF (vídeo de 18/06).
-- Pedidos da Mariana:
-- (a) endereço próprio na NF, separado em campos;
-- (b) projeto não pode ser obrigatório (RT etc emitidas sem vínculo a projeto);
-- (c) auto-fill do tomador a partir do cliente do projeto (cliente já tem
--     CPF/CNPJ e endereço cadastrados em `clients`).
--
-- O auto-fill é feito no form (frontend) lendo `clients`. Aqui só adicionamos
-- as colunas de endereço na própria NF e garantimos que `project_id` aceita
-- NULL (já aceita no schema, mas o constraint atual está como NOT NULL na
-- definição original — confirmar e relaxar caso esteja).

ALTER TABLE public.invoices_nf
  ADD COLUMN IF NOT EXISTS recipient_address_street text,
  ADD COLUMN IF NOT EXISTS recipient_address_number text,
  ADD COLUMN IF NOT EXISTS recipient_address_complement text,
  ADD COLUMN IF NOT EXISTS recipient_address_neighborhood text,
  ADD COLUMN IF NOT EXISTS recipient_address_city text,
  ADD COLUMN IF NOT EXISTS recipient_address_state text,
  ADD COLUMN IF NOT EXISTS recipient_address_zip text;

-- Garante que project_id é opcional (era nullable na definição mais recente,
-- mas a migração inicial pode ter criado com NOT NULL; defensivo).
ALTER TABLE public.invoices_nf
  ALTER COLUMN project_id DROP NOT NULL;

-- Backfill: NFs antigas sem `competence_month` ficam com YYYY-MM da
-- `issue_date`. Isso é a causa raiz do bug "NF some do relatório
-- fiscal" — quando o form não auto-preenche a competência, o filtro
-- `.eq("competence_month", X)` esconde a NF. Corrigir histórico e
-- daqui pra frente o form/hook preenche sozinho.
UPDATE public.invoices_nf
SET competence_month = to_char(issue_date, 'YYYY-MM')
WHERE competence_month IS NULL
  AND issue_date IS NOT NULL;
