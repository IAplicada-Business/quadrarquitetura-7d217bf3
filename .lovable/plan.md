

## Reformulação dos Dashboards + Sidebar Auto-Expand

### Dashboard Escritorio — Reescrita completa

**Consolidar queries**: Substituir as 7 queries atuais por 2 hooks:
- `useEscritorioMetrics()`: busca `leads`, `proposals`, `payments` (source=escritorio) em paralelo com `Promise.all` dentro de uma única `queryFn`
- `useEscritorioAlertas()`: busca `schedule_tasks` atrasadas, `invoices_nf` pendentes, leads sem follow-up (created_at < 7 dias, status=novo) em paralelo

**Layout em 3 blocos horizontais**:

```text
┌─────────────────────────────────────────────────────────────┐
│ BLOCO 1 — PULSO COMERCIAL (4 KPIs em linha)                │
│ [Leads mês ▲12%] [Conversão 25% ~] [Ticket R$X ▼5%] [Aguardando 3 ⚠] │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────┬──────────────────────────────────┐
│ BLOCO 2a — Gráfico       │ BLOCO 2b — Próximos Recebimentos│
│ Barras Receita 6 meses   │ Top 5 pagamentos pendentes      │
│ Eixo Y: formatCurrency   │ com badge dias restantes         │
└──────────────────────────┴──────────────────────────────────┘
┌──────────────┬──────────────┬───────────────────────────────┐
│ Tarefas      │ NFs pendentes│ Leads sem follow-up +7d       │
│ atrasadas: 3 │ envio: 2     │ 4 leads                       │
│ → link       │ → link       │ → link                        │
└──────────────┴──────────────┴───────────────────────────────┘
```

- Variação % mês anterior para Leads e Ticket Médio (comparar mês atual vs `subMonths(1)`)
- Badge de urgência em "Aguardando Resposta" se alguma proposta enviada há >7 dias
- **Corrigir eixo Y**: `const formatCurrency = (v) => v >= 1000 ? \`R$${(v/1000).toFixed(0)}k\` : \`R$${v}\``
- **Estados vazios informativos**: cada bloco sem dados mostra ícone outline + texto "Nenhum [item] ainda" + botão de ação (ex: "Adicionar lead" → navigate)
- Remover: gráficos de pizza orçamentos, leads por status vertical, "Receitas vs Despesas", propostas recentes, cards duplicados de resumo financeiro inferior

---

### Dashboard Obras — Reescrita do layout

**Remover Tabs** (operacional/financeiro) → layout direto em 3 blocos. Manter toda a lógica Multi-Obras existente abaixo.

**BLOCO 1 — Visão Geral**: Barra horizontal de projetos ativos (reutilizar `projectProgress` + Q-number). Cada projeto: nome Q(n), progress bar, status badge, próxima atividade. Clicável → `/projects/:id`.

**BLOCO 2 — Alertas Consolidados**: 3 colunas em grid:
- Atividades atrasadas (já calculado em `multiObras.alerts.overdueTasks`)
- Materiais não entregues (usar `delayedMaterials`)
- Pagamentos de obra vencidos (usar `overduePayments`)
Cada com contagem + badge de urgência + itens clicáveis.

**BLOCO 3 — Financeiro de Obras**: Gráfico de barras por projeto (orçado vs gasto). Eixo Y com mesmo `formatCurrency`. Reutilizar `fin.financeiroObras`. Manter Multi-Obras (fornecedores, timeline) abaixo.

---

### Sidebar — Auto-expand grupo ativo

**`AppSidebar.tsx`**:
- Importar `useEffect`
- Computar `activeGroup` a partir de `location.pathname`: mapear prefixos de rota para labels de grupo (`/dashboard` → "Dashboard", `/leads` → "Leads", `/clients` → "Clientes", `/projects` ou `/construction` → "Projetos", `/admin` → "Administrativo")
- No `useEffect`, quando a rota muda: expandir o grupo ativo, colapsar os demais
- Salvar/restaurar estado de sidebar colapsada em `localStorage` (chave `sidebar-collapsed`)

---

### Arquivos alterados

| Arquivo | Acao |
|---|---|
| `src/pages/DashboardEscritorio.tsx` | Reescrita completa: 2 hooks, 3 blocos, estados vazios, eixo Y corrigido |
| `src/pages/DashboardObras.tsx` | Remover tabs, reestruturar em 3 blocos + manter Multi-Obras |
| `src/components/layout/AppSidebar.tsx` | Auto-expand grupo ativo + localStorage |

Nenhuma rota, migration ou funcionalidade existente alterada.

