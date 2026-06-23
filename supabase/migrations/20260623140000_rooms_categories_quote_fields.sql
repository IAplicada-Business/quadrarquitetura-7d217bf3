-- Sprint 4 (item 1) — cômodos por projeto.
-- Solicitado em vídeo de 18/06: "preciso do cômodo, separação por cômodo".
CREATE TABLE IF NOT EXISTS public.project_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_rooms_project
  ON public.project_rooms(project_id);

ALTER TABLE public.project_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_rooms_select_own"
  ON public.project_rooms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "project_rooms_insert_own"
  ON public.project_rooms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_rooms_update_own"
  ON public.project_rooms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "project_rooms_delete_own"
  ON public.project_rooms FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_project_rooms_updated_at
  BEFORE UPDATE ON public.project_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sprint 4 (itens 1, 3) — vincular compra a um cômodo e campos contextuais
-- para revestimentos (metragem em m² e nº de peças).
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.project_rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS area_m2 numeric,
  ADD COLUMN IF NOT EXISTS pieces_count integer;

CREATE INDEX IF NOT EXISTS idx_purchases_room
  ON public.purchases(room_id);

-- Sprint 4 (item 2) — categorias de compra editáveis pelo usuário.
-- Hoje a lista é hardcoded em PurchaseForm; passa a vir de settings,
-- igual `supplier_categories` faz para fornecedores.
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS purchase_categories text[];

-- Seed para usuários que já têm settings (lista pedida em vídeo +
-- as 8 categorias antigas mantidas para continuidade).
UPDATE public.settings
SET purchase_categories = ARRAY[
  'Obra Civil',
  'Elétrica',
  'Hidráulica',
  'Pintura',
  'Forro/Gesso',
  'Marcenaria',
  'Mobiliário',
  'Vidros',
  'Revestimentos',
  'Louças e Metais',
  'Iluminação',
  'Eletrodomésticos',
  'Diversos'
]
WHERE purchase_categories IS NULL;
