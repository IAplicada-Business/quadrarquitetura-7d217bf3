

## Remover filtros `.eq("user_id")` redundantes nas queries de tabelas com RLS de equipe

### Diagnóstico

Os hooks principais (`useLeads`, `useProposals`, `useContracts`) **já não têm** o filtro `.eq("user_id", ...)` nas queries SELECT — estão corretos.

O problema está concentrado nos **dashboards**, que fazem queries diretas com `.eq("user_id", user!.id)` em tabelas que já têm RLS de equipe:

### Alterações

**`src/pages/DashboardEscritorio.tsx`** — Remover `.eq("user_id", user!.id)` de 4 queries sobre tabelas com RLS de equipe:
- Linha ~109: `projects` query
- Linha ~136: `leads` query  
- Linha ~145: `proposals` (métricas) query
- Linha ~154: `proposals` (listagem recente) query

Manter `.eq("user_id", user!.id)` nas queries de `payments` (linha ~118) e `budget_quotes` (linha ~127) — essas tabelas ainda usam RLS individual.

**`src/pages/DashboardObras.tsx`** — Remover `.eq("user_id", user!.id)` de 1 query:
- Linha ~84: `projects` query

Manter o filtro nas queries de `pending_items`, `material_tracking` e `schedule_tasks` — todas ainda com RLS individual.

**`src/pages/VoiceTasksPage.tsx`** — Remover `.eq("user_id", user!.id)` de 1 query:
- Linha ~46: `projects` query (lista de projetos para seleção)

### Arquivos

| Arquivo | Ação |
|---|---|
| `DashboardEscritorio.tsx` | Remover filtro user_id de 4 queries (projects, leads, 2x proposals) |
| `DashboardObras.tsx` | Remover filtro user_id de 1 query (projects) |
| `VoiceTasksPage.tsx` | Remover filtro user_id de 1 query (projects) |

Total: 6 remoções de filtro. Nenhuma tabela sem RLS de equipe é afetada.

