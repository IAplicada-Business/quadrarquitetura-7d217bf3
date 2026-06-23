-- Sprint 7 — endereço próprio em clients.
-- Pedido (anexo 2): "em clientes, não tem como cadastrar endereço".
-- Adicionamos campos atômicos para casar com o que já existe em
-- invoices_nf (assim o auto-fill da NF pode puxar direto do cliente).

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_zip text;
