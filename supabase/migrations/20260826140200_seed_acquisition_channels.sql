-- Seed inicial de canais de aquisição — um conjunto por time existente
-- (não um conjunto global), já que a leitura é escopada por
-- get_team_user_ids(). Time sem nenhum membro é ignorado (nada para
-- ver o canal); time que já tem algum canal cadastrado é pulado, pra
-- essa migration poder ser reaplicada em ambientes diferentes sem
-- duplicar linhas.

DO $$
DECLARE
  t RECORD;
  creator uuid;
BEGIN
  FOR t IN SELECT DISTINCT team_id FROM public.team_members LOOP
    IF EXISTS (
      SELECT 1
      FROM public.acquisition_channels ac
      JOIN public.team_members tm ON tm.user_id = ac.user_id
      WHERE tm.team_id = t.team_id
    ) THEN
      CONTINUE;
    END IF;

    SELECT user_id INTO creator
    FROM public.team_members
    WHERE team_id = t.team_id
    ORDER BY (role = 'admin') DESC, user_id
    LIMIT 1;

    CONTINUE WHEN creator IS NULL;

    INSERT INTO public.acquisition_channels (user_id, name, category, color, display_order) VALUES
      (creator, 'Instagram',              'digital',   '#E1306C', 0),
      (creator, 'Site',                   'digital',   '#2563EB', 1),
      (creator, 'Google',                 'digital',   '#EA4335', 2),
      (creator, 'Indicação de cliente',   'indicacao', '#16A34A', 3),
      (creator, 'Indicação de parceiro',  'indicacao', '#0EA5E9', 4),
      (creator, 'Evento',                 'evento',    '#F59E0B', 5),
      (creator, 'Outros',                 'outros',    '#64748B', 6);
  END LOOP;
END $$;
