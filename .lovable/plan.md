

## Correções restantes da auditoria

### O que já foi feito
- payment_type + tax_rate_percent (migration + hooks)
- useInvoicesNF sem as any
- today memoizado em useComercialMetrics
- useFinanceiroMetrics reescrito
- Páginas mortas deletadas

### O que falta

| # | Item | Arquivo | Ação |
|---|---|---|---|
| 9 | Console.log em produção | 8 arquivos | Remover `console.log` de produção; manter `console.error` em catch blocks (são úteis para debug) |
| 11 | useCostReferenceTable as any | `src/hooks/useCostReferenceTable.ts` | Substituir `as any` por tipagem `as never` nos insert/update; tipar o select com cast explícito |
| 17 | SettingsPage as any | `src/pages/SettingsPage.tsx:55-58` | Mesmo tratamento — `as never` nos insert/update |
| 8 | Status do funil | `src/hooks/useComercialMetrics.ts:94` | Adicionar `"em_contato"` ao filtro de Contato (junto com `contato_feito`) para cobrir ambos os formatos caso apareçam no futuro |
| 18 | WeeklyReportView sem limit | `src/components/reports/WeeklyReportView.tsx:55` | Adicionar `.limit(500)` na query de schedule_tasks (a única sem filtro de data) |

### Detalhes

**Console.log cleanup** — Remover os `console.log("[VoiceAgent]...")` e `console.log("[VoiceTasks]...")` (6 ocorrências). Manter os `console.error` dentro de catch blocks pois são úteis para diagnóstico.

**useCostReferenceTable** — O `as any` no `.select()` linha 49 é necessário porque a coluna `scope` não está nos types gerados. Usar cast `as unknown as ...` com tipo inline para o retorno. Os `as any` nos insert/update (linhas 79, 85) serão trocados por `as never`.

**SettingsPage** — Linhas 55 e 58: `update(updates as any)` e `insert({...} as any)` trocados por `as never`.

**Status funil** — Linha 94: adicionar `"em_contato"` ao array de status para Contato, garantindo compatibilidade futura.

**WeeklyReportView** — Linha 55: `schedule_tasks` query sem date filter recebe `.limit(500)`.

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/layout/VoiceAgentDialog.tsx` | Remover 2 console.log |
| `src/hooks/useVoiceTasks.ts` | Remover 3 console.log |
| `src/hooks/useCostReferenceTable.ts` | Remover as any |
| `src/pages/SettingsPage.tsx` | Remover as any |
| `src/hooks/useComercialMetrics.ts` | Adicionar em_contato ao funil |
| `src/components/reports/WeeklyReportView.tsx` | Adicionar limit na query |

Nenhuma lógica de negócio alterada. Nenhuma rota alterada.

