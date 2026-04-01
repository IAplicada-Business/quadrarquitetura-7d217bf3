

## Corrigir exibição de valor de propostas fechadas no Dashboard Escritório

### Problema identificado

O Dashboard Escritório não exibe o **valor total das propostas aprovadas/fechadas**. Os KPIs atuais mostram:
- "Ticket Médio" (média das propostas do mês)
- "Aprovadas no Mês" (apenas contagem)
- "Total Orçado" vem de `projects.estimated_budget`, não das propostas

Falta um KPI de **faturamento fechado** (soma de `final_value` ou `price_full` das propostas com status `aprovada`).

### Alterações

**`src/pages/DashboardEscritorio.tsx`**:

1. No bloco `computed`, adicionar:
   - `faturamentoMes`: soma de `price_full` (ou `final_value`) das propostas aprovadas no mês atual (filtrar por `approved_at` no mês corrente)
   - `faturamentoTotal`: soma de todas as propostas aprovadas

2. Na query `dash-esc-proposals-metrics` (linha 147): adicionar `final_value, approved_at` ao select

3. Adicionar novo card KPI **"Faturamento Fechado"** na seção de Métricas Comerciais, mostrando `faturamentoMes` com descrição "aprovado este mês"

4. No card "Aprovadas no Mês" (linha 614-623): adicionar o valor total abaixo da contagem

5. Nos 3 cards de resumo financeiro (linhas 662-695): substituir "Total Orçado" (que usa `estimated_budget`) por "Faturamento Aprovado" usando a soma das propostas aprovadas — ou manter ambos lado a lado

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/DashboardEscritorio.tsx` | Ajustar query + computed + adicionar KPI de faturamento |

Nenhuma migration necessária.

