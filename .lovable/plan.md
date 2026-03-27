

## Relatório de progresso automático para o portal do cliente

### 1. Migration SQL — tabela `weekly_reports`

```sql
CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  summary text NOT NULL,
  next_steps text NOT NULL,
  completion_percent integer NOT NULL DEFAULT 0,
  photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  client_pending text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_reports_team_select" ON public.weekly_reports
  FOR SELECT TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "weekly_reports_team_insert" ON public.weekly_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_reports_team_update" ON public.weekly_reports
  FOR UPDATE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "weekly_reports_team_delete" ON public.weekly_reports
  FOR DELETE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
```

### 2. Hook — `src/hooks/useWeeklyReports.ts`

CRUD hook com TanStack Query, query key `["weekly_reports", projectId]`. Inclui:
- Listagem ordenada por `week_start DESC`
- Create mutation com upload de fotos ao Storage (`project-files` bucket, path `reports/{projectId}/{weekStart}/`)
- Delete mutation

### 3. `ProjectTrackingTab.tsx` — Botão + Modal

Adicionar botão "Gerar Relatório Semanal" ao lado de "Novo Registro". Modal com:
- Período (semana calculada automaticamente via `startOfWeek`/`endOfWeek`)
- Resumo do período (textarea, obrigatório)
- Próximas etapas (textarea, obrigatório)
- % conclusão (number input, default = média de `progress_percentage` das tarefas do projeto, editável)
- Upload de fotos (input file multiple, max 6, upload ao Storage)
- Pendências do cliente (textarea opcional)

Usa o hook `useScheduleTasks` existente para calcular a % média, e `useWeeklyReports` para salvar.

### 4. Edge Function `get-client-portal-data` — Incluir `weekly_reports`

Adicionar query paralela:
```typescript
supabase.from("weekly_reports")
  .select("id, week_start, summary, next_steps, completion_percent, photo_urls, client_pending, created_at")
  .eq("project_id", projectId)
  .order("week_start", { ascending: false })
  .limit(20)
```

Incluir `weekly_reports` no JSON de resposta.

### 5. `ClientPortal.tsx` — Seção "Relatórios Semanais"

Abaixo do Cronograma, nova seção com ícone `FileBarChart`:
- Lista de relatórios em ordem decrescente
- Cada item: período formatado ("Semana de 17 a 23 de março"), barra de progresso (%), resumo, próximas etapas
- Fotos em grid 2x3, clicáveis (reutiliza lightbox existente)
- Se `client_pending` presente: box com borda laranja e texto "Precisamos de você:"

Atualizar interface `PortalData` para incluir `weekly_reports`.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabela `weekly_reports` + RLS equipe |
| `src/hooks/useWeeklyReports.ts` | Criar hook CRUD |
| `src/components/projects/ProjectTrackingTab.tsx` | Adicionar botão + modal de relatório semanal |
| `supabase/functions/get-client-portal-data/index.ts` | Incluir `weekly_reports` na query |
| `src/pages/ClientPortal.tsx` | Adicionar seção "Relatórios Semanais" |

