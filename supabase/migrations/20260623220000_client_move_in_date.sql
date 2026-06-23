-- Sprint 7d (call 23/06): "fazer a contagem de trás pra frente — falta
-- tantos dias para sua mudança". Campo opcional no projeto que guarda
-- a data planejada da mudança do cliente para o imóvel. Distinto de
-- `expected_end_date` (que é fim da obra contratada) — costuma ser
-- alguns dias depois para acomodar limpeza, vistoria etc.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_move_in_date date;

COMMENT ON COLUMN public.projects.client_move_in_date IS
  'Data planejada da mudança do cliente. Usada no countdown apresentado para o cliente.';
