-- Conteúdo editável do site institucional (rota /).
--
-- Contexto: textos e imagens do site (hero, sobre, serviços, portfólio,
-- contato, rodapé) estavam fixos em código; qualquer ajuste exigia dev e
-- deploy. Esta tabela guarda, por time, o valor de cada campo editável.
-- A aba Configurações → Site grava aqui e o site lê direto do banco a
-- cada carregamento, então a publicação não depende de redeploy.
--
-- Uma linha por (team_id, key). key = "<seção>.<campo>", ex.: "hero.title".
-- Sem linha => o site usa o padrão em código (src/lib/siteContent.ts), então
-- a tabela pode começar vazia. value_json guarda o valor do campo: string
-- para text/richtext/image (URL pública), array de objetos para list.
--
-- Isolamento por team_id com os helpers de 20260929120000
-- (get_my_team_id / get_my_team_ids), mesmo padrão de proposal_blocks.
-- O visitante anônimo não lê a tabela: lê pela função
-- get_public_site_content, que só devolve key/type/value_json.

CREATE TABLE public.site_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL DEFAULT public.get_my_team_id(),
  key text NOT NULL,
  type text NOT NULL CHECK (type IN ('text', 'richtext', 'image', 'list')),
  value_json jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_content_team_key_unique UNIQUE (team_id, key)
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Leitura e escrita para o time inteiro (mesmo critério de proposal_blocks).
CREATE POLICY "Team can view site_content" ON public.site_content FOR SELECT
  USING (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can create site_content" ON public.site_content FOR INSERT
  WITH CHECK (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can update site_content" ON public.site_content FOR UPDATE
  USING (team_id IN (SELECT public.get_my_team_ids()))
  WITH CHECK (team_id IN (SELECT public.get_my_team_ids()));
CREATE POLICY "Team can delete site_content" ON public.site_content FOR DELETE
  USING (team_id IN (SELECT public.get_my_team_ids()));

-- updated_at e updated_by sempre carimbados pelo banco (o cliente não
-- consegue gravar outro autor).
CREATE OR REPLACE FUNCTION public.stamp_site_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER stamp_site_content BEFORE INSERT OR UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.stamp_site_content();

-- Leitura pública do site: só os campos publicados do time informado.
CREATE OR REPLACE FUNCTION public.get_public_site_content(p_team_id uuid)
RETURNS TABLE (key text, type text, value_json jsonb, updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sc.key, sc.type, sc.value_json, sc.updated_at
  FROM site_content sc
  WHERE sc.team_id = p_team_id
$$;

REVOKE ALL ON FUNCTION public.get_public_site_content(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_site_content(uuid) TO anon, authenticated;

-- Bucket público para as imagens do site (já redimensionadas no admin).
INSERT INTO storage.buckets (id, name, public) VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload site media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media');
CREATE POLICY "Anyone can view site media" ON storage.objects FOR SELECT USING (bucket_id = 'site-media');
CREATE POLICY "Authenticated users can update site media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-media');
CREATE POLICY "Authenticated users can delete site media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media');

NOTIFY pgrst, 'reload schema';
