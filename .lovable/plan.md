

# Relatório de Varredura 360 — Projeto Quadra Arquitetura

---

## CRÍTICOS

### 1. Coluna `tax_rate_percent` não existe na tabela `settings`
- **Categoria**: Banco / Bug
- **Arquivo**: `src/components/projects/ProjectFinancialTab.tsx:112-113`, `src/hooks/useFinanceiroMetrics.ts:72`
- **Descrição**: O código busca `settings.tax_rate_percent` mas essa coluna não existe na tabela `settings` (colunas reais: id, user_id, theme, cost_per_sqm, supplier_categories, message_templates, calculation_params, scope). O `ProjectFinancialTab` faz `.select("*").maybeSingle()` e acessa `(data as any)?.tax_rate_percent`, que sempre retorna `undefined` → fallback 6%. No `useFinanceiroMetrics` o valor é hardcoded como 6 sem consultar a tabela.
- **Impacto**: Impossível configurar a taxa de impostos — sempre será 6% independente do que o usuário salve em Settings.
- **Sugestão**: Criar migration adicionando `tax_rate_percent numeric DEFAULT 6` na tabela `settings`, ou armazená-lo dentro do JSONB `calculation_params`.

### 2. Coluna `payment_type` não existe na tabela `payments`
- **Categoria**: Banco / Bug
- **Arquivo**: `src/hooks/useFinanceiroMetrics.ts:78-84`
- **Descrição**: A especificação original pedia filtrar por `payment_type = 'receita'/'despesa'`, mas a tabela `payments` não tem essa coluna. O hook implementa heurística frágil baseada em string matching na `description` (`"receita"`, `"honorár"`) ou ausência de `supplier_name`. Pagamentos de clientes com supplier_name preenchido serão classificados como despesa.
- **Impacto**: KPIs financeiros (receita, despesa, margem, DRE) podem estar completamente errados.
- **Sugestão**: Adicionar coluna `payment_type text DEFAULT 'despesa'` na tabela `payments` e classificar explicitamente.

### 3. Tabelas `reports` e `site_tracking` nunca são acessadas pelo frontend
- **Categoria**: Banco / Código morto
- **Arquivo**: Tabelas `reports`, `site_tracking` no Supabase
- **Descrição**: Nenhuma query no frontend referencia essas tabelas. Existem no banco mas são completamente órfãs.
- **Impacto**: Dados podem ser gravados nessas tabelas sem nunca serem lidos; ocupam espaço e confundem manutenção.
- **Sugestão**: Verificar se são usadas por edge functions; caso contrário, considerar remoção.

### 4. `useInvoicesNF` usa `as any` no `from()` — contorna tipagem do Supabase
- **Categoria**: Bug / Tipagem
- **Arquivo**: `src/hooks/useInvoicesNF.ts:22, 33, 40, 43`
- **Descrição**: `from("invoices_nf" as any)` indica que a tabela pode não estar no tipo gerado automaticamente, ou que o tipo está desatualizado. Todas as operações (select, insert, update, delete) usam `as any`, eliminando validação de tipos.
- **Impacto**: Erros de schema silenciosos — colunas renomeadas ou removidas não geram erro de compilação.
- **Sugestão**: Regenerar `types.ts` para incluir `invoices_nf`; remover todos os `as any`.

### 5. 948 ocorrências de `as any` no código fonte
- **Categoria**: Bug / Tipagem
- **Arquivo**: 46 arquivos (destaque: `ConstructionTasks.tsx`, `ProjectScheduleTab.tsx`, `DashboardObras.tsx`, `useCostReferenceTable.ts`)
- **Descrição**: Uso massivo de `as any` para contornar problemas de tipagem, especialmente em queries com joins (`(t as any).projects?.name`), inserções e updates.
- **Impacto**: Bugs silenciosos — mudanças na estrutura do banco não geram erros de compilação; erros de runtime difíceis de rastrear.
- **Sugestão**: Priorizar os 10 hooks de dados críticos; tipar retornos de queries com interfaces explícitas.

---

## IMPORTANTES

### 6. Páginas `Budgets.tsx`, `Purchases.tsx`, `Financial.tsx` são código morto
- **Categoria**: Código morto
- **Arquivo**: `src/pages/Budgets.tsx`, `src/pages/Purchases.tsx`, `src/pages/Financial.tsx`
- **Descrição**: São PlaceholderPages que nunca são importadas no `App.tsx` — as rotas `/budgets`, `/purchases`, `/financial` fazem redirect para `/projects`.
- **Impacto**: 3 arquivos desnecessários no bundle.
- **Sugestão**: Deletar os 3 arquivos.

### 7. `useFinanceiroMetrics` não busca `tax_rate` do banco
- **Categoria**: Bug
- **Arquivo**: `src/hooks/useFinanceiroMetrics.ts:72`
- **Descrição**: `const taxRate = 6; // default` — hardcoded, não consulta settings. Mesmo que a coluna existisse, o hook não a busca.
- **Impacto**: Margem líquida e DRE sempre calculados com 6% de impostos.
- **Sugestão**: Adicionar settings query ao `Promise.all` do hook.

### 8. Status `"aprovado"` vs `"fechado"` inconsistente no funil
- **Categoria**: Bug / Lógica
- **Arquivo**: `src/hooks/useComercialMetrics.ts:94-102`
- **Descrição**: O funil comercial filtra por `status === "fechado"`, mas o `LEAD_STATUSES` em `useLeads.ts` define o status como `"fechado"`. Porém a especificação original mencionava `"aprovado"`. A conversão em `LeadsPipeline` usa `moveStatus` para mover para `"fechado"`. **Atualmente consistente**, mas o hook comercial não inclui `"em_contato"` no funil (usa `"contato_feito"` que é o status real).
- **Impacto**: Se houver leads com status `"em_contato"` (mencionado em spec do pipeline 6m), eles não aparecem no funil.
- **Sugestão**: Verificar quais status realmente existem no banco e padronizar.

### 9. Console.log em produção — 83 ocorrências
- **Categoria**: Performance / Limpeza
- **Arquivo**: 8 arquivos (VoiceAgentDialog, useVoiceTasks, LeadsProposals, etc.)
- **Descrição**: Logs de debug como `console.log("[VoiceAgent] Sending transcript:", ...)` permanecem no código de produção.
- **Impacto**: Poluição do console; potencial vazamento de dados sensíveis (transcripts de voz).
- **Sugestão**: Remover ou condicionar a `import.meta.env.DEV`.

### 10. Queries sem `.limit()` buscam todos os registros
- **Categoria**: Performance
- **Arquivo**: `useComercialMetrics.ts:67-68` (leads e proposals sem limit), `useFinanceiroMetrics.ts:54-58` (payments sem limit), `DashboardObras.tsx` (múltiplas queries sem limit)
- **Descrição**: Hooks de dashboard buscam **todas** as leads, proposals e payments da conta sem paginação. Com crescimento de dados, a performance degradará.
- **Impacto**: Latência crescente e consumo de memória em dashboards.
- **Sugestão**: Filtrar por período (últimos 12 meses) no backend; ou usar queries SQL com agregações.

### 11. `useCostReferenceTable` usa `as any` para acessar tabela `settings` com colunas não tipadas
- **Categoria**: Tipagem / Bug potencial
- **Arquivo**: `src/hooks/useCostReferenceTable.ts:48-85`
- **Descrição**: Todas as operações contra `settings` são feitas com `as any` incluindo select, insert e update. A coluna `scope` e `calculation_params` podem não estar nos tipos gerados.
- **Impacto**: Erros silenciosos se schema mudar.
- **Sugestão**: Atualizar types.ts ou usar interfaces explícitas.

### 12. `today` recriado a cada render nos hooks de métricas
- **Categoria**: Performance / Bug
- **Arquivo**: `src/hooks/useComercialMetrics.ts:61`, `src/hooks/useFinanceiroMetrics.ts:48`
- **Descrição**: `const today = new Date()` fora do `useMemo` — recria Date a cada render. O `useMemo` tem `today` como dependência, causando recomputação a cada render.
- **Impacto**: Recomputação desnecessária dos dados calculados a cada re-render do componente.
- **Sugestão**: Memoizar `today` com `useMemo(() => new Date(), [])` ou usar string do dia.

---

## MENORES

### 13. Arquivos de edge functions sem uso confirmado: `search-prices-bh`
- **Categoria**: Código morto
- **Arquivo**: `supabase/functions/search-prices-bh/index.ts`
- **Descrição**: Chamado apenas por `PriceSearchDialog` — funcional mas pouco usado.
- **Impacto**: Nenhum imediato.

### 14. Tabela `budgets` possivelmente redundante com `budget_quotes`
- **Categoria**: Banco
- **Arquivo**: Tabela `budgets` no Supabase
- **Descrição**: Tanto `budgets` quanto `budget_quotes` existem com schemas similares (project_id, value, status, supplier_id). O frontend usa principalmente `budget_quotes`.
- **Impacto**: Confusão de nomenclatura; dados podem estar divididos entre duas tabelas.
- **Sugestão**: Auditar uso e consolidar se possível.

### 15. Imports não utilizados potenciais
- **Categoria**: Código morto
- **Arquivo**: Vários (ex: `DashboardObras.tsx` importa `BarChart3`, `Bell` que podem não ser usados)
- **Impacto**: Bundle ligeiramente maior.
- **Sugestão**: Rodar linter com `no-unused-imports`.

### 16. Foreign keys ausentes em todas as tabelas
- **Categoria**: Banco
- **Arquivo**: Schema do Supabase
- **Descrição**: Nenhuma tabela tem foreign keys declaradas no schema (todas mostram "No foreign keys"). Relações são mantidas apenas por convenção no código.
- **Impacto**: Dados órfãos possíveis (ex: payments com project_id que não existe mais). Integridade referencial não garantida.
- **Sugestão**: Adicionar foreign keys gradualmente, começando por tabelas críticas (payments → projects, proposals → leads).

### 17. `SettingsPage` salva campos genéricos via `as any`
- **Categoria**: Tipagem
- **Arquivo**: `src/pages/SettingsPage.tsx:55-58`
- **Descrição**: Insert e update na tabela `settings` usam `as any` para contornar tipagem.
- **Impacto**: Campos inválidos podem ser salvos silenciosamente.

### 18. `WeeklyReportView` busca `select("*")` em 4 tabelas sem limit
- **Categoria**: Performance
- **Arquivo**: `src/components/reports/WeeklyReportView.tsx:54-58`
- **Descrição**: Busca todos os schedule_tasks, diary entries, materials e payments do projeto sem paginação.
- **Impacto**: Lentidão em projetos com muitos registros.

---

## Resumo

| Severidade | Total |
|---|---|
| CRÍTICO | 5 |
| IMPORTANTE | 7 |
| MENOR | 6 |

| Categoria | Total |
|---|---|
| Banco | 5 |
| Bug | 4 |
| Tipagem | 4 |
| Código morto | 3 |
| Performance | 4 |

### Top 5 prioridades de correção imediata

1. **Criar coluna `payment_type`** na tabela `payments` e corrigir `useFinanceiroMetrics` — KPIs financeiros podem estar todos errados
2. **Criar coluna `tax_rate_percent`** na tabela `settings` e conectar ao hook financeiro — impostos hardcoded
3. **Corrigir `useInvoicesNF`** — remover `as any` e regenerar types
4. **Memoizar `today`** nos hooks de métricas — re-renders desnecessários
5. **Deletar páginas mortas** (Budgets.tsx, Purchases.tsx, Financial.tsx)

