-- Código de serviço LC 116/2003 por NF (editável por nota)
ALTER TABLE public.invoices_nf ADD COLUMN IF NOT EXISTS service_code text;

-- Default configurável globalmente nas settings da empresa
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS nf_service_code text;
