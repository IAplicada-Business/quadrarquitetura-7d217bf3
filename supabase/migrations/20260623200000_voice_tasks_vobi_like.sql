-- Sprint 6 — voice_tasks ganha cara de Vobi: tarefas pessoais
-- (sem projeto), atribuição entre membros, recorrência e checklist
-- (checklist via parent_id já existia).
--
-- Mudanças:
-- 1. project_id passa a ser opcional (tarefas pessoais da Quadra).
-- 2. assigned_to (uuid → auth.users) para atribuir a outro membro do
--    time. Sem assigned_to, dono == criador.
-- 3. is_recurring + recurrence_rule (RRULE simples: 'FREQ=WEEKLY',
--    'FREQ=MONTHLY;BYDAY=MO,FR' etc).
-- 4. tags (text[]) para classificação livre (#financeiro, #urgente).

ALTER TABLE public.voice_tasks
  ALTER COLUMN project_id DROP NOT NULL;

ALTER TABLE public.voice_tasks
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_rule text,
  ADD COLUMN IF NOT EXISTS tags text[];

CREATE INDEX IF NOT EXISTS idx_voice_tasks_assigned_to
  ON public.voice_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_voice_tasks_due_date
  ON public.voice_tasks(due_date) WHERE due_date IS NOT NULL;

COMMENT ON COLUMN public.voice_tasks.assigned_to IS
  'Membro do time responsável. NULL = dono é o criador (user_id).';
COMMENT ON COLUMN public.voice_tasks.recurrence_rule IS
  'Regra RRULE simplificada (FREQ=WEEKLY, FREQ=MONTHLY;BYDAY=...).';
