-- Vincula cada lead a um canal de aquisição cadastrado. Nullable: leads
-- existentes e leads criados sem canal escolhido (ex.: insert anônimo
-- do formulário do site) continuam válidos. ON DELETE SET NULL porque
-- o CRUD de canais só expõe arquivar (soft delete via is_active) — um
-- delete definitivo não deve arrastar leads junto.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.acquisition_channels(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_channel_id ON public.leads(channel_id);

NOTIFY pgrst, 'reload schema';
