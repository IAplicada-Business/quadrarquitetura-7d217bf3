-- Checklist de entrega da obra (pendências finais).
-- Solicitado na call de 16/04: lista de pendências que aparecem no fim
-- da obra ("falta passar rejunte naquela pedra", "falta passar PU"),
-- sem percentual, apenas resolvido/pendente. Ligada opcionalmente a
-- uma atividade do escopo (project_activities).
--
-- ATENÇÃO: este arquivo nasceu com timestamp retroativo (entrou em 23/06
-- datado de 20/04) e por isso nunca foi aplicado — a tabela é criada de
-- fato em 20260928120000_delivery_checklist_items_ensure.sql. Mantido
-- apenas por histórico e tornado repetível para não quebrar um replay.

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

DROP POLICY IF EXISTS "delivery_checklist_select_own" ON public.delivery_checklist_items;
CREATE POLICY "delivery_checklist_select_own"
  ON public.delivery_checklist_items FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "delivery_checklist_insert_own" ON public.delivery_checklist_items;
CREATE POLICY "delivery_checklist_insert_own"
  ON public.delivery_checklist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delivery_checklist_update_own" ON public.delivery_checklist_items;
CREATE POLICY "delivery_checklist_update_own"
  ON public.delivery_checklist_items FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "delivery_checklist_delete_own" ON public.delivery_checklist_items;
CREATE POLICY "delivery_checklist_delete_own"
  ON public.delivery_checklist_items FOR DELETE USING (auth.uid() = user_id);

-- Auto-timestamp updated_at (usa função existente do projeto).
DROP TRIGGER IF EXISTS update_delivery_checklist_updated_at ON public.delivery_checklist_items;
CREATE TRIGGER update_delivery_checklist_updated_at
  BEFORE UPDATE ON public.delivery_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
