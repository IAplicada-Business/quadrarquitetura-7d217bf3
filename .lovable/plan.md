

## Visão Multi-Obras — Dashboard de Obras

### Contexto
Adicionar 3 novas seções ao `DashboardObras.tsx` na aba Operacional, abaixo do conteúdo existente. Sem alterações de banco, rotas ou abas.

### Alterações — único arquivo: `src/pages/DashboardObras.tsx`

**Seção 1 — Mapa de Fornecedores por Obra (Tabela Cruzada)**

- Computed via `useMemo` from existing `scheduleTasks` and `projects` data (already fetched with `supplier_name`)
- Need to add `supplier_name` to the schedule tasks query (currently not selected)
- Build matrix: rows = unique `supplier_name` from tasks with status `em_execucao`/`executado`/`planejado`; columns = active projects
- For each supplier × project cell, compute which ISO weeks they're allocated (from `start_date`/`end_date`)
- Cell color: green (allocated, no conflict), yellow (same supplier allocated in another project same week), gray (not allocated)
- Render as `<Table>` with sticky first column

**Seção 2 — Timeline Comparativa (Mini-Gantt)**

- Computed from `projects` (active) + `scheduleTasks` (min start_date, max end_date per project)
- Each row = project name + horizontal bar showing date range
- Bar color: green (on track — progress ≥ expected by date), yellow (slightly behind), red (significantly behind)
- Progress calculated from done tasks / total tasks per project
- Tooltip on hover: name, progress %, next delivery
- Rendered as styled divs with relative positioning against a shared timeline axis

**Seção 3 — Alertas Consolidados**

- Card with 3 sub-sections:
  1. **Tarefas atrasadas**: `scheduleTasks` where `end_date < today` and status not `executado`/`concluido`, sorted by days overdue, top 10
  2. **Pagamentos vencidos**: `payments` where `due_date < today` and status `pendente`, all
  3. **Materiais aguardando entrega**: `material_tracking` where `purchase_date` exists, `delivery_date` is null, and `purchase_date < today - 7 days`
- Each item shows project name + detail + days overdue
- Each item is a `<Link>` to `/projects/:projectId`

**Data changes to existing queries:**
- Add `supplier_name` to the `dash-obras-schedule` query select (line 106)
- Add `purchase_date, delivery_date` to the `dash-obras-materials` query select (line 97) — already have these? Check: yes `purchase_date` and `delivery_date` are not in the current select, need to add them

**UI placement:** After the "Próximas Etapas" card (line 445), before `</TabsContent>` for "operacional"

### Technical details

- All 3 sections use existing data — no new queries needed, just expand select fields
- `useNavigate` or `<Link>` for clickable alerts
- Week calculation: `getISOWeek` from date-fns for supplier matrix
- Timeline bar positioning: compute global min/max dates across all active projects, then position bars proportionally
- No new files, no new dependencies

### Arquivos editados
- `src/pages/DashboardObras.tsx` — add supplier_name/purchase_date/delivery_date to queries, add 3 new sections in operacional tab

