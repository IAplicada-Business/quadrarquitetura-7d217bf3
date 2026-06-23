-- Sprint 4c (item 9b) — templates de atividades por tipo de obra.
-- Pedido vídeo 9 da Mariana: "quando você copia um template do Trello,
-- você já tem as atividades. Na hora que ele entende que eu tenho que
-- fazer piso, ele entende que eu preciso da data da compra do
-- revestimento". Esta tabela armazena os templates; ao criar/editar um
-- projeto, o usuário escolhe um template e o sistema copia as linhas
-- para `project_activities` com `depends_on` materializados.

CREATE TABLE IF NOT EXISTS public.activity_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  -- Filtro por tipo de obra (residencial/comercial/saude/outro). NULL
  -- significa "qualquer". Usamos o enum `client_type` que já vale para
  -- `projects.project_type`.
  project_type client_type,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.activity_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  ambiente text,
  discipline text,
  area_m2 numeric,
  duration_days integer,
  description text,
  -- Dependências internas ao template: array de `position` (não UUIDs).
  -- Ao aplicar o template, traduzimos os índices para os UUIDs reais
  -- criados em `project_activities`. Isso permite editar o template
  -- sem ter referências quebradas em projetos antigos.
  depends_on_positions integer[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_template_items_template
  ON public.activity_template_items(template_id);

ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_templates_select_own"
  ON public.activity_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_templates_insert_own"
  ON public.activity_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_templates_update_own"
  ON public.activity_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "activity_templates_delete_own"
  ON public.activity_templates FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "activity_template_items_select_own"
  ON public.activity_template_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_template_items_insert_own"
  ON public.activity_template_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_template_items_update_own"
  ON public.activity_template_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "activity_template_items_delete_own"
  ON public.activity_template_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_activity_templates_updated_at
  BEFORE UPDATE ON public.activity_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_template_items_updated_at
  BEFORE UPDATE ON public.activity_template_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
