-- Checklist de entrega: pendências visíveis para toda a equipe da obra,
-- no mesmo padrão de projects/project_activities (get_team_user_ids).
-- Antes cada usuário só via os itens que ele mesmo criou.
--
-- Envolvido em um guard porque a tabela base nunca chegou a ser criada
-- (a migration original entrou com timestamp retroativo e foi ignorada):
-- sem o guard, esta migration aborta em "relation does not exist" e trava
-- a fila inteira antes da 20260928120000, que cria a tabela.

DO $$
BEGIN
IF to_regclass('public.delivery_checklist_items') IS NOT NULL THEN

DROP POLICY IF EXISTS "delivery_checklist_select_own" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "delivery_checklist_update_own" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "delivery_checklist_delete_own" ON public.delivery_checklist_items;

DROP POLICY IF EXISTS "Team can view delivery_checklist_items" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "Team can update delivery_checklist_items" ON public.delivery_checklist_items;
DROP POLICY IF EXISTS "Team can delete delivery_checklist_items" ON public.delivery_checklist_items;

CREATE POLICY "Team can view delivery_checklist_items"
  ON public.delivery_checklist_items FOR SELECT
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can update delivery_checklist_items"
  ON public.delivery_checklist_items FOR UPDATE
  USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete delivery_checklist_items"
  ON public.delivery_checklist_items FOR DELETE
  USING (user_id IN (SELECT get_team_user_ids()));
ELSE
  RAISE NOTICE 'delivery_checklist_items ainda não existe; as políticas são criadas em 20260928120000.';
END IF;
END $$;

-- INSERT continua exigindo auth.uid() = user_id (delivery_checklist_insert_own).
