-- Cadastro estruturado de canais de aquisição.
--
-- Contexto: leads.origin é um enum fechado (indicacao/instagram/google/
-- site/outro) — adicionar um canal novo hoje exige migration. Camilla
-- precisa cadastrar canais (Instagram, indicações, eventos, parcerias)
-- sem depender de dev. Esta tabela substitui esse papel; leads.origin
-- é mantido intacto (histórico + fluxo de insert anônimo do site).
--
-- Segue o mesmo padrão de time do resto do app: sem coluna team_id
-- própria — isolamento via user_id (dono do registro) + RLS usando
-- get_team_user_ids(), igual a leads/proposals/contracts/projects.
-- Escrita (criar/editar/arquivar/reordenar) é restrita a admins
-- (has_role), leitura é liberada pro time inteiro (kanban, formulário
-- de lead e dashboard precisam ler os canais).

CREATE TYPE public.acquisition_channel_category AS ENUM (
  'digital',
  'indicacao',
  'evento',
  'parceria',
  'outros'
);

CREATE TABLE public.acquisition_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  category public.acquisition_channel_category NOT NULL DEFAULT 'outros',
  color text NOT NULL DEFAULT '#64748B',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_acquisition_channels_user_id ON public.acquisition_channels(user_id);

ALTER TABLE public.acquisition_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view acquisition_channels" ON public.acquisition_channels FOR SELECT
  USING (user_id IN (SELECT get_team_user_ids()));

CREATE POLICY "Admins can create acquisition_channels" ON public.acquisition_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update acquisition_channels" ON public.acquisition_channels FOR UPDATE
  USING (user_id IN (SELECT get_team_user_ids()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete acquisition_channels" ON public.acquisition_channels FOR DELETE
  USING (user_id IN (SELECT get_team_user_ids()) AND has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_acquisition_channels_updated_at BEFORE UPDATE ON public.acquisition_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
