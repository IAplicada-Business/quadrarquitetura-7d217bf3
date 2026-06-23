-- Sprint 6 — templates de atividades com m² parametrizado.
-- Pedido: cada item do template pode ter área absoluta (fixa em m²)
-- ou proporcional a uma "área de referência" do projeto. Ao aplicar
-- o template, o usuário informa a área total e o sistema calcula
-- `area_m2 = area_factor * total_area`.

-- Estratégia: adicionamos uma coluna `area_basis` com 3 modos:
--   - 'fixed'        : usa `area_m2` cru (comportamento atual)
--   - 'proportional' : `area_m2 = area_factor * total_area`
--                       (ex: factor=0.30 => 30% da área total)
--   - 'per_room'     : `area_m2 = area_factor * room_count` (média por cômodo)
-- `area_factor` é o multiplicador e fica null para 'fixed'.

ALTER TABLE public.activity_template_items
  ADD COLUMN IF NOT EXISTS area_basis text NOT NULL DEFAULT 'fixed'
    CHECK (area_basis IN ('fixed', 'proportional', 'per_room')),
  ADD COLUMN IF NOT EXISTS area_factor numeric;

COMMENT ON COLUMN public.activity_template_items.area_basis IS
  'Modo de cálculo da área: fixed (m² absoluto em area_m2), proportional (area_factor x total_area), per_room (area_factor x room_count).';
COMMENT ON COLUMN public.activity_template_items.area_factor IS
  'Coeficiente quando area_basis != fixed. Ex: 0.3 = 30% da área total.';
