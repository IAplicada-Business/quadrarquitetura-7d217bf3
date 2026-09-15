-- =====================================================================
-- Buddy · Bug — migration padrão para o sistema de cada cliente IAplicada
--
-- Mesmas tabelas e colunas do Banco de Oportunidades da LCR (pacote de
-- 17/08). O CRM IAplicada lê `public.oportunidades` (+ votos, comentários
-- públicos e nome do autor) direto do Supabase do projeto, a cada 5 min.
-- Por isso: NÃO renomeie tabelas nem colunas. Pode acrescentar colunas.
--
-- Idempotente: pode rodar de novo sem quebrar.
--
-- O que este arquivo adapta sozinho (o original tinha marcas [ADAPTAR]):
--   * cliente_id: sem FK por padrão; ganha FK para public.empresas se ela
--     existir no projeto.
--   * is_admin() / has_acesso(text): só cria se o projeto ainda não tiver.
--     A versão criada aqui tenta, nesta ordem: usuarios_perfil.perfil='admin'
--     → user_roles.role='admin' → profiles.role in (admin, owner, gestor).
--     >>> Se o projeto usa outro esquema de papéis, ajuste o bloco 0. <<<
--   * permissões (permissoes_perfil / usuarios_perfil): só roda se as
--     tabelas existirem; e a policy de leitura de usuarios_perfil é SOMADA
--     (nova policy), não substituída.
--   * iaplicada_links (bloco 8): links de Mapeamento / Portal / Treinamento
--     que o CRM mantém e o ícone "Docs do projeto" do cliente lê.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Funções de papel
--
-- [ADAPTADO — Quadra Arquitetura] A heurística genérica do pacote foi
-- trocada pelo esquema real deste projeto: papéis vivem em
-- public.user_roles (enum app_role: admin | moderator | user) e já existe
-- public.has_role(uuid, app_role) SECURITY DEFINER. is_admin() só delega
-- pra ela — uma fonte de verdade só, a mesma que o resto do sistema (RLS
-- de leads, obras, etc.) e o front (usePermissions) usam.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $f$
  SELECT auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role)
$f$;

DO $$
BEGIN
  IF to_regprocedure('public.has_acesso(text)') IS NULL THEN
    -- Sem catálogo de acessos no projeto: qualquer autenticado tem acesso.
    CREATE FUNCTION public.has_acesso(chave text)
    RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $f$
      SELECT auth.uid() IS NOT NULL
    $f$;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1. Tabela principal
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.oportunidades_num_seq START 1;

CREATE TABLE IF NOT EXISTS public.oportunidades (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                text UNIQUE NOT NULL,
  tipo                  text NOT NULL CHECK (tipo IN ('bug','melhoria','duvida')),
  titulo                text NOT NULL,
  descricao             text NOT NULL,
  tela_origem           text,
  cliente_id            uuid,
  autor_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  impacto               text CHECK (impacto IN ('bloqueia','atrapalha','cosmetico')),
  frequencia_uso        text,
  problema_resolve      text,
  prioridade            text CHECK (prioridade IN ('critica','alta','media','baixa')) DEFAULT 'media',
  status                text DEFAULT 'backlog',
  cerebro_conversa_id   uuid,
  aprovado_autor_em     timestamptz,
  aprovado_autor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  data_prevista         date,
  criado_em             timestamptz NOT NULL DEFAULT now(),
  atualizado_em         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oportunidades
  ADD COLUMN IF NOT EXISTS aprovado_autor_em timestamptz,
  ADD COLUMN IF NOT EXISTS aprovado_autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_prevista date;

-- cliente_id → FK só se o projeto tiver carteira `empresas`
DO $$
BEGIN
  IF to_regclass('public.empresas') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oportunidades_cliente_id_fkey') THEN
    ALTER TABLE public.oportunidades
      ADD CONSTRAINT oportunidades_cliente_id_fkey
      FOREIGN KEY (cliente_id) REFERENCES public.empresas(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.oportunidades DROP CONSTRAINT IF EXISTS oportunidades_status_check;
ALTER TABLE public.oportunidades
  ADD CONSTRAINT oportunidades_status_check
  CHECK (status IN ('backlog','em_analise','planejado','em_dev','entregue','descartado'));
ALTER TABLE public.oportunidades ALTER COLUMN status SET DEFAULT 'backlog';

CREATE INDEX IF NOT EXISTS ix_oportunidades_status  ON public.oportunidades(status);
CREATE INDEX IF NOT EXISTS ix_oportunidades_tipo    ON public.oportunidades(tipo);
CREATE INDEX IF NOT EXISTS ix_oportunidades_autor   ON public.oportunidades(autor_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS ix_oportunidades_cliente ON public.oportunidades(cliente_id);
CREATE INDEX IF NOT EXISTS ix_oportunidades_atualizado ON public.oportunidades(atualizado_em);

COMMENT ON TABLE public.oportunidades IS
  'Buddy · Bug (bug/melhoria/dúvida). Espelhado no CRM IAplicada a cada 5 min — não renomear tabela/colunas.';
COMMENT ON COLUMN public.oportunidades.aprovado_autor_em IS
  'Preenchido quando quem criou o card aprova a entrega (status entregue).';
COMMENT ON COLUMN public.oportunidades.data_prevista IS
  'Data prevista de solução. Editável só por admin (trg_oportunidades_guard_data_prevista).';

-- ---------------------------------------------------------------------
-- 2. Tabelas satélite
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.oportunidade_votos (
  oportunidade_id uuid NOT NULL REFERENCES public.oportunidades(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  votado_em       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (oportunidade_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.oportunidade_comentarios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES public.oportunidades(id) ON DELETE CASCADE,
  autor_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo            text NOT NULL CHECK (tipo IN ('interno','publico')) DEFAULT 'interno',
  conteudo        text NOT NULL,
  criado_em       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_oport_com_oport
  ON public.oportunidade_comentarios(oportunidade_id, criado_em);
COMMENT ON COLUMN public.oportunidade_comentarios.tipo IS
  'publico = resposta lida por quem reportou o card; interno = nota da equipe (só admin e o autor da nota leem).';

CREATE TABLE IF NOT EXISTS public.oportunidade_historico (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES public.oportunidades(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo     text NOT NULL,
  mudado_por      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mudado_em       timestamptz NOT NULL DEFAULT now(),
  comentario      text
);
CREATE INDEX IF NOT EXISTS ix_oport_hist_oport
  ON public.oportunidade_historico(oportunidade_id, mudado_em);

CREATE TABLE IF NOT EXISTS public.oportunidade_anexos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES public.oportunidades(id) ON DELETE CASCADE,
  comentario_id   uuid REFERENCES public.oportunidade_comentarios(id) ON DELETE CASCADE,
  autor_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path    text NOT NULL,
  nome_arquivo    text NOT NULL,
  content_type    text,
  tamanho_bytes   integer,
  criado_em       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_oport_anexo_oport
  ON public.oportunidade_anexos(oportunidade_id, criado_em);
CREATE INDEX IF NOT EXISTS ix_oport_anexo_com
  ON public.oportunidade_anexos(comentario_id) WHERE comentario_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 3. Triggers — as regras de negócio moram aqui, não na UI
-- ---------------------------------------------------------------------

-- 3.1 Número OPT-XXXX + carimbo de atualização.
CREATE OR REPLACE FUNCTION public.oportunidades_gera_numero()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero IS NULL OR btrim(NEW.numero) = '' THEN
    NEW.numero := 'OPT-' || lpad(nextval('public.oportunidades_num_seq')::text, 4, '0');
  END IF;
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_oportunidades_numero ON public.oportunidades;
CREATE TRIGGER trg_oportunidades_numero
  BEFORE INSERT OR UPDATE ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.oportunidades_gera_numero();

-- 3.2 Histórico de status (SECURITY DEFINER: só o trigger escreve lá).
CREATE OR REPLACE FUNCTION public.oportunidades_log_status()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_motivo text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_motivo := nullif(btrim(coalesce(current_setting('app.motivo_status', true), '')), '');
    INSERT INTO public.oportunidade_historico
      (oportunidade_id, status_anterior, status_novo, mudado_por, comentario)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), v_motivo);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_oportunidades_status ON public.oportunidades;
CREATE TRIGGER trg_oportunidades_status
  AFTER UPDATE OF status ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.oportunidades_log_status();

-- 3.3 Mudou de coluna = aprovação anterior perde validade.
CREATE OR REPLACE FUNCTION public.oportunidades_reset_aprovacao()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.aprovado_autor_em := NULL;
    NEW.aprovado_autor_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_oportunidades_reset_aprovacao ON public.oportunidades;
CREATE TRIGGER trg_oportunidades_reset_aprovacao
  BEFORE UPDATE OF status ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.oportunidades_reset_aprovacao();

-- 3.4 Mover card no Kanban é admin-only; exceção: autor devolve
--     Entregue → Em análise enquanto não aprovou.
CREATE OR REPLACE FUNCTION public.oportunidades_guard_status_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF coalesce(auth.jwt() ->> 'role', '') = 'service_role' THEN
      RETURN NEW;
    END IF;
    IF OLD.status = 'entregue'
       AND NEW.status = 'em_analise'
       AND OLD.autor_id = auth.uid()
       AND OLD.aprovado_autor_em IS NULL THEN
      RETURN NEW;
    END IF;
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Apenas administradores podem mover cards no Kanban.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_oportunidades_guard_status ON public.oportunidades;
CREATE TRIGGER trg_oportunidades_guard_status
  BEFORE UPDATE OF status ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.oportunidades_guard_status_admin();

-- 3.5 Data prevista: promessa ao cliente, só admin escreve.
CREATE OR REPLACE FUNCTION public.oportunidades_guard_data_prevista()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.data_prevista IS DISTINCT FROM OLD.data_prevista THEN
    IF coalesce(auth.jwt() ->> 'role', '') = 'service_role' THEN
      RETURN NEW;
    END IF;
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Apenas administradores podem definir a data prevista de solução.'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_oportunidades_guard_data_prevista ON public.oportunidades;
CREATE TRIGGER trg_oportunidades_guard_data_prevista
  BEFORE UPDATE OF data_prevista ON public.oportunidades
  FOR EACH ROW EXECUTE FUNCTION public.oportunidades_guard_data_prevista();

-- ---------------------------------------------------------------------
-- 4. RPC de recusa de entrega (motivo cai na mesma linha do histórico)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recusar_entrega_oportunidade(p_id uuid, p_motivo text)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_autor   uuid;
  v_status  text;
  v_aprov   timestamptz;
  v_motivo  text := btrim(coalesce(p_motivo, ''));
BEGIN
  IF length(v_motivo) < 10 THEN
    RAISE EXCEPTION 'Descreva o motivo da recusa (mínimo 10 caracteres) — ele fica no histórico do card.'
      USING ERRCODE = '22023';
  END IF;
  SELECT autor_id, status::text, aprovado_autor_em
    INTO v_autor, v_status, v_aprov
    FROM public.oportunidades WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Card não encontrado.' USING ERRCODE = 'P0002';
  END IF;
  IF v_status <> 'entregue' THEN
    RAISE EXCEPTION 'Só é possível recusar cards na coluna Entregue.' USING ERRCODE = '22023';
  END IF;
  IF v_aprov IS NOT NULL THEN
    RAISE EXCEPTION 'Esta entrega já foi aprovada e não pode ser recusada.' USING ERRCODE = '22023';
  END IF;
  IF v_autor IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas quem criou o card ou um admin pode recusar a entrega.'
      USING ERRCODE = '42501';
  END IF;
  PERFORM set_config('app.motivo_status', v_motivo, true);
  UPDATE public.oportunidades
     SET status = 'em_analise', aprovado_autor_em = NULL, aprovado_autor_id = NULL
   WHERE id = p_id;
END;
$$;
REVOKE ALL     ON FUNCTION public.recusar_entrega_oportunidade(uuid, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.recusar_entrega_oportunidade(uuid, text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.recusar_entrega_oportunidade(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------
-- 5. Grants + RLS
-- ---------------------------------------------------------------------
-- [ADAPTADO — Quadra] O trigger trg_oportunidades_numero chama
-- nextval() na sequência e NÃO é SECURITY DEFINER: roda como o usuário que
-- inseriu. Sem USAGE na sequência, todo INSERT de card morre com
-- "permission denied for sequence oportunidades_num_seq" — ou seja, ninguém
-- consegue abrir card. Em projetos Supabase isso costuma passar despercebido
-- porque o default privilege do schema public já concede; o grant explícito
-- abaixo não depende disso.
GRANT USAGE, SELECT ON SEQUENCE public.oportunidades_num_seq TO authenticated;
GRANT ALL   ON SEQUENCE public.oportunidades_num_seq TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.oportunidades            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oportunidade_votos       TO authenticated;
GRANT SELECT, INSERT                 ON public.oportunidade_comentarios TO authenticated;
GRANT SELECT                         ON public.oportunidade_historico   TO authenticated;
GRANT SELECT, INSERT                 ON public.oportunidade_anexos      TO authenticated;
GRANT ALL ON public.oportunidades, public.oportunidade_votos,
             public.oportunidade_comentarios, public.oportunidade_historico,
             public.oportunidade_anexos TO service_role;

ALTER TABLE public.oportunidades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidade_votos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidade_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidade_historico   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oportunidade_anexos      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_oport_select ON public.oportunidades;
CREATE POLICY p_oport_select ON public.oportunidades
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_oport_insert ON public.oportunidades;
CREATE POLICY p_oport_insert ON public.oportunidades
  FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());

DROP POLICY IF EXISTS p_oport_update ON public.oportunidades;
CREATE POLICY p_oport_update ON public.oportunidades
  FOR UPDATE TO authenticated
  USING (autor_id = auth.uid() OR public.is_admin())
  WITH CHECK (autor_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS p_oport_delete ON public.oportunidades;
CREATE POLICY p_oport_delete ON public.oportunidades
  FOR DELETE TO authenticated
  USING (autor_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS p_oport_votos_select ON public.oportunidade_votos;
CREATE POLICY p_oport_votos_select ON public.oportunidade_votos
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS p_oport_votos_insert ON public.oportunidade_votos;
CREATE POLICY p_oport_votos_insert ON public.oportunidade_votos
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS p_oport_votos_update ON public.oportunidade_votos;
CREATE POLICY p_oport_votos_update ON public.oportunidade_votos
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS p_oport_votos_delete ON public.oportunidade_votos;
CREATE POLICY p_oport_votos_delete ON public.oportunidade_votos
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS p_oport_com_select ON public.oportunidade_comentarios;
CREATE POLICY p_oport_com_select ON public.oportunidade_comentarios
  FOR SELECT TO authenticated
  USING (tipo = 'publico' OR autor_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS p_oport_com_insert ON public.oportunidade_comentarios;
CREATE POLICY p_oport_com_insert ON public.oportunidade_comentarios
  FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());

DROP POLICY IF EXISTS p_oport_hist_select ON public.oportunidade_historico;
CREATE POLICY p_oport_hist_select ON public.oportunidade_historico
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_oport_anexo_select ON public.oportunidade_anexos;
CREATE POLICY p_oport_anexo_select ON public.oportunidade_anexos
  FOR SELECT TO authenticated
  USING (
    comentario_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.oportunidade_comentarios c
      WHERE c.id = oportunidade_anexos.comentario_id
        AND (c.tipo = 'publico' OR c.autor_id = auth.uid() OR public.is_admin())
    )
  );
DROP POLICY IF EXISTS p_oport_anexo_insert ON public.oportunidade_anexos;
CREATE POLICY p_oport_anexo_insert ON public.oportunidade_anexos
  FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());

-- ---------------------------------------------------------------------
-- 6. Bucket privado dos prints
-- ---------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('oportunidade-anexos', 'oportunidade-anexos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS p_storage_oport_anexo_select ON storage.objects;
CREATE POLICY p_storage_oport_anexo_select ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'oportunidade-anexos');
DROP POLICY IF EXISTS p_storage_oport_anexo_insert ON storage.objects;
CREATE POLICY p_storage_oport_anexo_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'oportunidade-anexos');

-- ---------------------------------------------------------------------
-- 7. RBAC — só quando o projeto tem o esquema da LCR
--    (permissoes_perfil / usuarios_perfil). Em projetos com profiles /
--    user_roles nada acontece aqui: a tela é liberada a todo autenticado e
--    o admin é quem is_admin() diz.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.permissoes_perfil') IS NOT NULL THEN
    UPDATE public.permissoes_perfil
       SET chaves = array_append(chaves, 'gestao:oportunidades')
     WHERE NOT ('gestao:oportunidades' = ANY(chaves));
  END IF;

  IF to_regclass('public.usuarios_perfil') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='usuarios_perfil' AND column_name='permissoes_custom') THEN
      UPDATE public.usuarios_perfil
         SET permissoes_custom = array_append(permissoes_custom, 'gestao:oportunidades')
       WHERE permissoes_custom IS NOT NULL
         AND NOT ('gestao:oportunidades' = ANY(permissoes_custom));
    END IF;
    -- A tela mostra o nome de quem abriu cada card: todo autenticado precisa
    -- ler usuarios_perfil dos outros. Policy SOMADA à existente (OR).
    DROP POLICY IF EXISTS usuarios_perfil_select_buddy ON public.usuarios_perfil;
    CREATE POLICY usuarios_perfil_select_buddy
      ON public.usuarios_perfil FOR SELECT TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 8. Docs do projeto (ícone com a logo do cliente no menu superior)
--    Links de acesso rápido que a IAplicada mantém no CRM (Gestão de
--    Projetos → Documentos): mapeamento, portal, treinamento. O CRM grava
--    aqui a cada sync (5 min); o sistema do cliente só lê. Link de arquivo
--    vem como URL assinada renovada a cada sync — não copie para outro lugar.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.iaplicada_links (
  chave          text PRIMARY KEY,           -- mapeamento | portal | treinamento | (outros)
  label          text NOT NULL,
  url            text,                       -- null = ainda não disponível ("em breve")
  descricao      text,
  ordem          integer NOT NULL DEFAULT 0,
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.iaplicada_links (chave, label, descricao, ordem) VALUES
  ('mapeamento',  'Mapeamento empresarial', 'Como a empresa opera, gargalos e desenho da solução', 1),
  ('portal',      'Portal do cliente',      'Roadmap, decisões e detalhamento do programa',          2),
  ('treinamento', 'Treinamento',            'Material de treinamento da plataforma',                 3)
ON CONFLICT (chave) DO NOTHING;
ALTER TABLE public.iaplicada_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_iaplicada_links_select ON public.iaplicada_links;
CREATE POLICY p_iaplicada_links_select ON public.iaplicada_links
  FOR SELECT TO authenticated USING (true);
GRANT SELECT ON public.iaplicada_links TO authenticated;
GRANT ALL ON public.iaplicada_links TO service_role;

COMMIT;
