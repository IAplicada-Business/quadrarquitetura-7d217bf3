

## Adicionar seção "Métricas Comerciais" ao Dashboard Escritório

### Resumo
Adicionar ao final (ou antes do resumo financeiro) uma nova seção com 4 KPI cards e 1 gráfico de barras empilhado, usando dados de `leads` e `proposals`. Tudo dentro do mesmo componente `DashboardEscritorio.tsx`, aproveitando as queries existentes (expandindo-as quando necessário).

### Edições em `src/pages/DashboardEscritorio.tsx`

**1. Expandir queries existentes**
- Query `dash-esc-leads`: já busca `id, status, name` — adicionar `created_at` para filtrar por mês
- Query `dash-esc-proposals`: atualmente limita a 4 e busca poucos campos — criar uma segunda query `dash-esc-proposals-metrics` sem limit, buscando `id, status, price_full, created_at` para cálculos de métricas

**2. Adicionar computações no `useMemo`**
- `leadsNoMes`: filtrar leads com `created_at` no mês atual → `.length`
- `taxaConversao`: leads com `status === "fechado"` / total leads × 100
- `ticketMedio`: proposals do mês atual com `price_full` → AVG
- `propostasAguardando`: proposals com status `enviada` (entre proposta enviada e convertido/perdido)
- Gráfico 6 meses: para cada mês, contar leads agrupados em 3 categorias (convertido=fechado, perdido, em andamento=resto)

**3. Adicionar config do gráfico**
```typescript
const leadsMetricasConfig: ChartConfig = {
  convertido: { label: "Convertido", color: "hsl(152, 60%, 40%)" },
  perdido: { label: "Perdido", color: "hsl(0, 70%, 50%)" },
  em_andamento: { label: "Em andamento", color: "hsl(210, 70%, 50%)" },
};
```

**4. Renderizar seção no JSX**
Inserir antes do "Resumo Financeiro" (linha ~454):
- Titulo "Métricas Comerciais"
- Grid 4 KPI cards: Leads no Mês, Taxa de Conversão, Ticket Médio, Propostas Aguardando
- Card com gráfico de barras empilhado (Recharts `BarChart` com `stackId`)

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/DashboardEscritorio.tsx` | Expandir queries, adicionar computações e seção de métricas comerciais |

