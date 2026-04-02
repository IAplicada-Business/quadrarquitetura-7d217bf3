

## Reformular DashboardEscritorio — Duas Sub-abas Comercial/Financeiro

### Estrutura

Reescrever `src/pages/DashboardEscritorio.tsx` completamente. Criar dois hooks dedicados em arquivos separados.

### Arquivos

| Arquivo | Acao |
|---|---|
| `src/hooks/useComercialMetrics.ts` | **Novo** — query consolidada leads + proposals |
| `src/hooks/useFinanceiroMetrics.ts` | **Novo** — query consolidada payments escritorio + settings |
| `src/pages/DashboardEscritorio.tsx` | **Reescrever** — duas abas com todos os blocos descritos |

### Hook `useComercialMetrics`

Uma unica chamada `Promise.all` buscando:
- `leads`: todos os campos necessarios (id, status, name, created_at, updated_at)
- `proposals`: com join leads(name, phone, email) — campos: id, status, price_full, final_value, sent_at, approved_at, created_at, updated_at, lead_id, notes

Retorna objeto computado com:
- **funil**: counts por estagio do mes atual (Leads/Contato/Reuniao/Proposta/Fechado) conforme regras de status cumulativo
- **kpis**: leadsThisMonth + variacao, taxaConversao + variacao, tempoMedioFechamento (dias), proposalsAguardando + hasUrgent
- **oportunidades**: leads com status proposta_enviada, top 4, com dias sem contato e valor proposta
- **propostas**: proposals com status enviada, top 5, com dias desde envio
- **pipeline6m**: ultimos 6 meses com counts fechados/propostas/em_andamento
- **ticketMedio**: AVG price_full das aprovadas no mes

staleTime: 5 minutos.

### Hook `useFinanceiroMetrics`

Uma unica chamada `Promise.all` buscando:
- `payments`: WHERE source = 'escritorio', com join projects(name)
- `settings`: para tax_rate_percent (default 6)
- `invoices_nf`: COUNT pendentes (para badge no card despesas)

Retorna:
- **kpis**: receitaMes + variacao, aReceber30d + count, despesasMes + variacao, margemLiquida + meta
- **proximosRecebimentos**: top 4 pendentes futuros
- **dre**: receita bruta, despesas, impostos, liquido, margem
- **grafico6m**: ultimos 6 meses receita/despesa/margem por mes
- **pendingNFs**: count

staleTime: 5 minutos.

### DashboardEscritorio.tsx — Layout

**Topo**: H1 "Escritorio" + subtitulo. Abaixo, duas abas customizadas (botoes com border-bottom) controladas por `useState<'comercial'|'financeiro'>('comercial')`.

Estilo das abas: `bg-transparent border-none px-6 py-2.5`, ativa com `border-b-2 border-[#1B2A4A] text-[#1B2A4A]`, inativa `border-b-2 border-transparent text-muted-foreground`. Separador `border-b` abaixo.

**Aba Comercial** (4 blocos):
1. Funil comercial — card full-width com 5 estagios em flex row, setas e taxas entre eles, rodape com conversao total e ticket medio
2. 4 KPI cards em grid-cols-4: Leads mes, Taxa conversao, Tempo medio fechamento, Propostas aguardando
3. Dois cards lado a lado: Oportunidades quentes (border-left colorida por dias) + Propostas em aberto (com status semantico)
4. Grafico pipeline 6 meses — barras empilhadas Recharts, cores #1B2A4A/#8B4557/#C4A882, altura 200px

**Aba Financeiro** (3 blocos):
1. 4 KPI cards com border-left colorida: Receita escritorio, A receber 30d, Despesas mes (com badge NFs pendentes), Margem liquida (com meta 60%)
2. Dois cards: Proximos recebimentos + DRE resumido (tabela vertical)
3. Grafico receita vs despesa — barras agrupadas + linha margem %, eixo Y esquerdo R$Xk, eixo Y direito %, altura 200px

### Detalhes tecnicos

- Usar `ComposedChart` do Recharts para o grafico financeiro (Bar + Line no mesmo chart)
- Formatar valores com `Intl.NumberFormat('pt-BR', ...)`, percentuais com `Math.round() + '%'`
- Eixo Y financeiro: `value >= 1000 ? R$${Math.round(value/1000)}k : R$${value}`
- Variacoes: sinal + cor (verde positivo, vermelho negativo; invertido para despesas)
- Estados vazios conforme especificado (zeros no funil, mensagens nas listas, eixos zerados nos graficos)
- Lead statuses mapeados: novo→Leads, em_contato/contato_feito→Contato, reuniao_agendada→Reuniao, proposta_enviada→Proposta, fechado/aprovado→Fechado

### O que e removido

Todos os hooks internos atuais (`useEscritorioMetrics`, `useEscritorioAlertas`, `useDREProjects`) e todo o JSX atual sao substituidos. Os 3 cards de alerta (Tarefas/NFs/Leads) sao removidos do escritorio — NFs pendentes vira badge no card Despesas; os outros migram para o Dashboard Obras ou ficam implicitos nas Oportunidades quentes.

Nenhuma outra rota, pagina ou componente alterado.

