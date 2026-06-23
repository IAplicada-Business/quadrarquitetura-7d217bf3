-- Sprint 7d (call 23/06): "implementar o cálculo do prazo de entrega
-- de marcenaria com base na data de medição informada".
--
-- Hoje os pré-requisitos de marcenaria (medir -45d, orçar -40d,
-- aprovar -30d, acompanhar produção -10d, conferir 0d) usam offset
-- estático sobre `start_date` da atividade. A Mariana quer informar
-- a data REAL de medição depois que acontece e o sistema recalcular
-- a entrega esperada.
--
-- Estratégia: armazenamos `medicao_date` na atividade. Quando ela
-- estiver preenchida, o cálculo dos pré-requisitos passa a usar
-- `medicao_date` como âncora (em vez de `start_date`).

ALTER TABLE public.project_activities
  ADD COLUMN IF NOT EXISTS medicao_date date;

COMMENT ON COLUMN public.project_activities.medicao_date IS
  'Data efetiva da medição em obra. Quando preenchida, vira a âncora dos pré-requisitos (marcenaria, marmoraria, vidros, esquadrias).';
