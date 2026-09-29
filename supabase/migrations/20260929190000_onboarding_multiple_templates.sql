-- Onboarding do cliente: vários modelos por time e escolha do modelo por obra.
--
-- Antes: um único template (is_default) por time; a obra ou seguia ele
-- ou tinha a própria cópia (sections_json). Agora o time pode ter vários
-- modelos (ex.: "Residencial", "Comercial", "Reforma") e cada obra escolhe
-- qual segue, sem precisar copiar.
--
-- Resolução do que o cliente vê no portal (/client/:token):
--   override.is_enabled = false            -> nada
--   override.sections_json é uma lista     -> cópia personalizada da obra
--   override.template_id preenchido        -> seções ao vivo desse modelo
--   sem override / template_id nulo        -> modelo padrão do time (is_default)
--
-- sections_json passa a aceitar NULL = "segue o modelo em template_id".
-- A unicidade de um is_default por time (índice parcial) continua.

ALTER TABLE public.onboarding_project_overrides
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.onboarding_templates(id) ON DELETE SET NULL;

ALTER TABLE public.onboarding_project_overrides
  ALTER COLUMN sections_json DROP NOT NULL,
  ALTER COLUMN sections_json DROP DEFAULT;

CREATE INDEX IF NOT EXISTS idx_onboarding_project_overrides_template
  ON public.onboarding_project_overrides(template_id);

-- Descrição curta do modelo, pra escolher na obra ("Obra residencial completa").
ALTER TABLE public.onboarding_templates
  ADD COLUMN IF NOT EXISTS description text;

NOTIFY pgrst, 'reload schema';
