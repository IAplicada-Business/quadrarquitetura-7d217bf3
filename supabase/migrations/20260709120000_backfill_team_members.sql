-- Backfill de team_members para usuários criados antes (ou fora) do fluxo
-- de times, ou cuja criação falhou no meio (auth user criado, time não).
--
-- Contexto: todo o RLS financeiro (payments, invoices_nf, projects etc.)
-- usa `user_id IN (SELECT get_team_user_ids())`. Usuário sem linha em
-- team_members recebe conjunto vazio e enxerga o sistema VAZIO ao logar —
-- era o que acontecia com o acesso da contabilidade ("não estou
-- conseguindo dar acesso a contabilidade").
--
-- Este banco é single-tenant (uma instância por escritório), então todos
-- os usuários pertencem ao mesmo time. Usa o time mais antigo existente;
-- se nenhum, cria um novo.

DO $$
DECLARE
  primary_team uuid;
BEGIN
  SELECT team_id INTO primary_team
  FROM public.team_members
  ORDER BY created_at ASC NULLS LAST
  LIMIT 1;

  IF primary_team IS NULL THEN
    primary_team := gen_random_uuid();
  END IF;

  INSERT INTO public.team_members (team_id, user_id, role)
  SELECT
    primary_team,
    u.id,
    CASE WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = u.id AND ur.role = 'admin'
    ) THEN 'admin' ELSE 'member' END
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.user_id = u.id
  )
  ON CONFLICT (team_id, user_id) DO NOTHING;
END $$;
