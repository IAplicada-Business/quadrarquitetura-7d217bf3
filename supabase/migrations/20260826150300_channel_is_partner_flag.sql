-- Marca quais canais de aquisição representam indicação de parceiro,
-- sem depender de casar por nome (frágil se o canal for renomeado).
-- Admin pode marcar/desmarcar qualquer canal em Configurações —
-- quando marcado, o formulário de lead comercial passa a pedir qual
-- parceiro indicou.

ALTER TABLE public.acquisition_channels
  ADD COLUMN is_partner_channel boolean NOT NULL DEFAULT false;

UPDATE public.acquisition_channels
SET is_partner_channel = true
WHERE name = 'Indicação de parceiro';

NOTIFY pgrst, 'reload schema';
