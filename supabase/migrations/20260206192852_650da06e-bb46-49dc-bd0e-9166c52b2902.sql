
-- 1. Add sub_status column for internal granularity
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sub_status TEXT;

-- 2. Save sub-status info before migration
UPDATE projects SET sub_status = 'levantamento' WHERE status = 'levantamento' AND sub_status IS NULL;
UPDATE projects SET sub_status = 'briefing' WHERE status = 'briefing' AND sub_status IS NULL;
UPDATE projects SET sub_status = 'estudo_preliminar' WHERE status = 'estudo_preliminar' AND sub_status IS NULL;
UPDATE projects SET sub_status = 'revisao' WHERE status = 'revisao' AND sub_status IS NULL;
UPDATE projects SET sub_status = 'anteprojeto_3d' WHERE status = 'anteprojeto_3d' AND sub_status IS NULL;
UPDATE projects SET sub_status = 'projeto_executivo' WHERE status = 'projeto_executivo' AND sub_status IS NULL;
UPDATE projects SET sub_status = 'memoria_calculo' WHERE status = 'memoria_calculo' AND sub_status IS NULL;
UPDATE projects SET sub_status = 'orcamento' WHERE status = 'orcamento' AND sub_status IS NULL;
UPDATE projects SET sub_status = 'reuniao_prioridades' WHERE status = 'reuniao_prioridades' AND sub_status IS NULL;

-- 3. Convert column to TEXT temporarily (to allow value changes)
ALTER TABLE projects ALTER COLUMN status DROP DEFAULT;
ALTER TABLE projects ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- 4. Migrate status values to new simplified phases
UPDATE projects SET status = 'proposta' WHERE status = 'proposta_enviada';
UPDATE projects SET status = 'contrato' WHERE status = 'contrato_assinado';
UPDATE projects SET status = 'projeto' WHERE status IN ('levantamento', 'briefing', 'estudo_preliminar', 'revisao', 'anteprojeto_3d', 'projeto_executivo');
UPDATE projects SET status = 'planejamento' WHERE status IN ('memoria_calculo', 'orcamento', 'reuniao_prioridades');
UPDATE projects SET status = 'mobilizacao' WHERE status = 'mobilizacao_fornecedores';
UPDATE projects SET status = 'execucao' WHERE status = 'execucao_obra';
-- 'concluido' stays unchanged

-- 5. Drop old enum type
DROP TYPE IF EXISTS project_status;

-- 6. Create new enum with only 7 values
CREATE TYPE project_status AS ENUM (
  'proposta',
  'contrato',
  'projeto',
  'planejamento',
  'mobilizacao',
  'execucao',
  'concluido'
);

-- 7. Convert column back to the new enum type
ALTER TABLE projects ALTER COLUMN status TYPE project_status USING status::project_status;

-- 8. Set new default
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'proposta'::project_status;
