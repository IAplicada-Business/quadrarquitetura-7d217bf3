-- Corrige "Could not find the table 'public.delivery_checklist_items'
-- in the schema cache" ao adicionar uma pendência no Checklist de Entrega.
--
-- A migration original (20260420120000_delivery_checklist.sql) foi criada
-- com timestamp retroativo: entrou no repositório em 23/06 datada de 20/04,
-- portanto anterior a migrations já aplicadas no banco. O runner aplica em
-- ordem de versão e ignora arquivo mais antigo que a última versão aplicada,
-- então a tabela nunca foi criada — e a migration seguinte
-- (20260923120000_delivery_checklist_team_access.sql), que só altera
-- políticas, não tinha como funcionar em cima de uma tabela inexistente.
--
-- Esta migration tem timestamp atual e é idempotente: cria o que falta e
-- não quebra onde a tabela já existir. O estado final das políticas é o
-- de acesso por equipe (get_team_user_ids), igual ao da migration de 23/09.

CREATE TABLE IF NOT EXISTS public.delivery_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.project_activities(id) ON DELETE SET NULL,
  discipline text,
  description text NOT NULL,
  responsible text,
  due_date date,
  priority text DEFAULT 'media' CHECK (priority IN ('baixa','media','alta','urgente')),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_checklist_project
  ON public.delivery_checklist_items(project_id);
CREATE INDEX IF NOT EXISTS idx_delivery_checklist_activity
  ON public.delivery_checklist_items(activity_id);

ALTER TABLE public.delivery_checklist_items ENABLE ROW LEVEL SECURITY;

-- Políticas: derruba as antigas (por dono) e as novas antes de recriar,
-- porque CREATE POLICY não aceita IF NOT EXISTS.
DROP POLICY IF EXISTS "delivery_checklist_select_own" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "delivery_checklist_update_own" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "delivery_checklist_delete_own" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "delivery_checklist_insert_own" ON public.delivery_checklist_items;

DROP POLICY IF EXISTS "Team can view delivery_checklist_items" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "Team can update delivery_checklist_items" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "Team can delete delivery_checklist_items" ON public.delivery_checklist_items;

CREATE POLICY "delivery_checklist_insert_own"
  ON public.delivery_checklist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can view delivery_checklist_items"
  ON public.delivery_checklist_items FOR SELECT
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can update delivery_checklist_items"
  ON public.delivery_checklist_items FOR UPDATE
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete delivery_checklist_items"
  ON public.delivery_checklist_items FOR DELETE
  USING (user_id IN (SELECT get_team_user_ids()));

DROP TRIGGER IF EXISTS update_delivery_checklist_updated_at ON public.delivery_checklist_items;
CREATE TRIGGER update_delivery_checklist_updated_at
  BEFORE UPDATE ON public.delivery_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- O erro é do cache de schema do PostgREST: mesmo com a tabela criada,
-- a API só a enxerga depois de recarregar.
NOTIFY pgrst, 'reload schema';
