-- Migração de dados: casa o valor legado de leads.origin (enum
-- client_origin, fechado em 5 valores) com o canal equivalente do seed,
-- por time do dono do lead. Não altera/zera leads.origin — ele
-- continua existindo para histórico e para o insert anônimo do
-- formulário do site (que grava origin = 'site' com user_id nulo).

WITH lead_team AS (
  SELECT l.id AS lead_id, l.origin, tm.team_id
  FROM public.leads l
  JOIN public.team_members tm ON tm.user_id = l.user_id
  WHERE l.channel_id IS NULL
),
origin_channel_name (origin_value, channel_name) AS (
  VALUES
    ('instagram', 'Instagram'),
    ('site',      'Site'),
    ('google',    'Google'),
    ('indicacao', 'Indicação de cliente'),
    ('outro',     'Outros')
)
UPDATE public.leads l
SET channel_id = ac.id
FROM lead_team lt
JOIN origin_channel_name ocn ON ocn.origin_value = lt.origin::text
JOIN public.acquisition_channels ac
  ON ac.name = ocn.channel_name
  AND ac.user_id IN (SELECT tm2.user_id FROM public.team_members tm2 WHERE tm2.team_id = lt.team_id)
WHERE l.id = lt.lead_id;

-- Leads do site (user_id NULL, sem time próprio): casa com o canal
-- "Site" do time com mais membros — é uma heurística, já que hoje o
-- app opera com um único time real. Decisão registrada no PR.
UPDATE public.leads l
SET channel_id = ac.id
FROM public.acquisition_channels ac
WHERE l.channel_id IS NULL
  AND l.user_id IS NULL
  AND l.origin = 'site'
  AND ac.name = 'Site'
  AND ac.user_id IN (
    SELECT tm.user_id
    FROM public.team_members tm
    WHERE tm.team_id = (
      SELECT team_id FROM public.team_members GROUP BY team_id ORDER BY count(*) DESC LIMIT 1
    )
  );

-- Registro para revisão da Camilla: qualquer lead que sobrar sem
-- channel_id aparece filtrando o pipeline por "Sem canal" (não requer
-- tabela de auditoria à parte). Aqui só deixamos um NOTICE pra quem
-- rodar a migration ver o tamanho do problema, se houver.
DO $$
DECLARE
  unmatched integer;
BEGIN
  SELECT count(*) INTO unmatched FROM public.leads WHERE channel_id IS NULL;
  RAISE NOTICE 'acquisition_channels backfill: % lead(s) sem channel_id — revisar no Pipeline com o filtro "Sem canal"', unmatched;
END $$;
