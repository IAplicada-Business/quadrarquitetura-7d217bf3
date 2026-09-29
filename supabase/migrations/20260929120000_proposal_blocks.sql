-- Blocos configuráveis do PDF da proposta.
--
-- Contexto: o PDF de 9 páginas (capa, quem somos, escopo, interiores,
-- gerenciamento, por que contratar, portfólio, valores, contato) tinha
-- todos os textos e a ordem fixos em código. Qualquer mudança no
-- portfólio de serviços exigia dev. Esta tabela guarda, por time, quais
-- blocos estão ligados, em que ordem aparecem e os textos de cada um.
--
-- Uma linha por (team_id, key). Sem linha => o app usa o padrão em código
-- (src/lib/proposalBlocks.ts), então a tabela pode começar vazia.
-- content_json guarda só os campos que o bloco expõe pra edição; o app
-- faz merge com o padrão e ignora chaves desconhecidas.
--
-- Isolamento por team_id (times de team_members). "order" é palavra
-- reservada em SQL, então a coluna de ordenação segue a convenção do
-- projeto: display_order.

-- Helper: times do usuário logado. SECURITY DEFINER pra não depender da
-- policy recursiva de team_members (mesmo motivo de get_team_user_ids).
CREATE OR REPLACE FUNCTION public.get_my_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.team_id
  FROM team_members tm
  WHERE tm.user_id = auth.uid()
$$;

-- Helper: time principal do usuário logado (o mais antigo). Usado como
-- DEFAULT de team_id, pra que o cliente não precise conhecer o id do time.
CREATE OR REPLACE FUNCTION public.get_my_team_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.team_id
  FROM team_members tm
  WHERE tm.user_id = auth.uid()
  ORDER BY tm.created_at ASC NULLS LAST
  LIMIT 1
$$;

CREATE TABLE public.proposal_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL DEFAULT public.get_my_team_id(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_blocks_team_key_unique UNIQUE (team_id, key)
);

CREATE INDEX idx_proposal_blocks_team_order ON public.proposal_blocks(team_id, display_order);

ALTER TABLE public.proposal_blocks ENABLE ROW LEVEL SECURITY;

-- Leitura e escrita liberadas pro time inteiro, igual a proposal_assets
-- (a aba "Proposta" das configurações já é editável por todo o time).
CREATE POLICY "Team can view proposal_blocks" ON public.proposal_blocks FOR SELECT
  USING (team_id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "Team can create proposal_blocks" ON public.proposal_blocks FOR INSERT
  WITH CHECK (auth.uid() = user_id AND team_id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "Team can update proposal_blocks" ON public.proposal_blocks FOR UPDATE
  USING (team_id IN (SELECT public.get_my_team_ids()))
  WITH CHECK (team_id IN (SELECT public.get_my_team_ids()));

CREATE POLICY "Team can delete proposal_blocks" ON public.proposal_blocks FOR DELETE
  USING (team_id IN (SELECT public.get_my_team_ids()));

CREATE TRIGGER update_proposal_blocks_updated_at BEFORE UPDATE ON public.proposal_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

NOTIFY pgrst, 'reload schema';
