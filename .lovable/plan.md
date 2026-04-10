

## Plano: Corrigir dashboards para dados parciais + estados vazios

### 1. Migration — preencher dados retroativos
```sql
UPDATE payments SET source = 'escritorio' WHERE source IS NULL AND project_id IS NULL;
UPDATE payments SET payment_type = 'receita' WHERE payment_type IS NULL;
```

### 2. `src/hooks/useFinanceiroMetrics.ts`
- **Remover filtro `.eq("source", "escritorio")`** da query e buscar todos os payments
- No `useMemo`, classificar receita/despesa de forma tolerante:
  - `isReceita`: `payment_type === "receita" || (!payment_type && source !== "obra")`
  - `isDespesa`: `payment_type === "despesa"`
- Filtrar por `source`: incluir `source === "escritorio"` OU `source IS NULL` (com `project_id IS NULL`)
- Excluir `status === "cancelado"` de todos os cálculos

### 3. `src/hooks/useComercialMetrics.ts`
- Já retorna zeros quando não há leads (divisões protegidas por `> 0`). Sem alteração necessária — a lógica já é segura.

### 4. `src/pages/DashboardObras.tsx`
- **Projetos ativos** (linha 103): adicionar `|| !p.status` para incluir projetos sem status:
  ```ts
  const active = projects.filter((p) => 
    ["execucao","mobilizacao","planejamento"].includes(p.status ?? "") || !p.status
  );
  ```
- **Gráfico orçado vs gasto** (linha 176): remover `.filter((d) => d.orcado > 0 || d.gasto > 0)` — manter todos os projetos ativos, com 0 se `estimated_budget` for null

### 5. `src/pages/DashboardEscritorio.tsx` — Estados vazios informativos
- **Aba Comercial**: quando `cm` é null ou `cm.funil[0].count === 0`, mostrar estado vazio com ícone `Users`, texto "Nenhum lead este mês", botão "Adicionar lead" → `/leads/pipeline`
- **Aba Financeiro**: quando `fm.kpis.receitaMes === 0`, mostrar estado vazio no card de receita com link "Registrar pagamento" → `/admin/settings`
- Manter cards de KPI visíveis com valor R$0 — estado vazio só nos blocos de lista (oportunidades, recebimentos)

### 6. `src/pages/DashboardObras.tsx` — Estados vazios
- **Projetos ativos = 0**: já tem estado vazio (ícone HardHat + "Nenhuma obra ativa"). Adicionar botão "Criar obra" → `/projects`
- **Alertas = 0 em todos os 3 cards**: já tratado. Sem alteração.

### Arquivos alterados
1. Migration SQL (data update via insert tool)
2. `src/hooks/useFinanceiroMetrics.ts` — tolerância nos filtros
3. `src/pages/DashboardObras.tsx` — filtro de status + gráfico
4. `src/pages/DashboardEscritorio.tsx` — estados vazios com ação

### O que NÃO muda
- Estrutura dos hooks (interfaces, exports)
- Nenhuma rota ou componente de página externo
- `useComercialMetrics` (já seguro)

