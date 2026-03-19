

## Relatório Semanal de Obra — Implementação

### Contexto
A página Reports.tsx já existe com 4 cards de tipo de relatório (semanal, financeiro, fornecedor, cliente) mas todos com placeholder. Implementar o tipo "semanal" com dados reais, preview, export PDF, copiar WhatsApp e persistência.

### Alterações

**1. Migration SQL** — criar tabela `reports`

```sql
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON reports FOR DELETE USING (auth.uid() = user_id);
```

**2. Novo componente `src/components/reports/WeeklyReportView.tsx`**

- Props: `projectId`, `projectName`
- State: `weekStart` / `weekEnd` (default: current week Mon-Sun), date pickers to change
- On render / week change, fetches all data for the period:
  - `schedule_tasks` where `project_id = X` — filter by status for concluded/in-progress/overdue/pending + next week
  - `site_diary_entries` where `entry_date BETWEEN weekStart AND weekEnd`
  - `material_tracking` where `purchase_date` or `delivery_date` in period
  - `payments` where `paid_date` in period and status = 'pago'
- Renders the full report layout as specified (header, summary, sections, photos, financial)
- "Exportar PDF" button: uses `window.print()` with print-specific CSS (the preview area is print-friendly)
- "Copiar para WhatsApp" button: generates plain text version without photos, copies to clipboard
- "Salvar Relatório" button: inserts into `reports` table with all fetched data as JSON content
- Photos section: shows up to 6 photos from diary entries with thumbnails

**3. Edit `src/pages/Reports.tsx`**

- When `selectedType === "semanal"` and a project is selected (`selectedProject !== "all"`), render `<WeeklyReportView>` instead of the placeholder
- If "semanal" selected but no project, show message asking to select a project
- Keep all existing report type cards and other UI intact

### Arquivos criados/editados
- 1 migration SQL (table `reports` + RLS)
- 1 componente criado: `WeeklyReportView.tsx`
- 1 arquivo editado: `Reports.tsx` (replace placeholder with real component for "semanal")
- Nenhuma aba, sub-aba ou rota existente alterada

