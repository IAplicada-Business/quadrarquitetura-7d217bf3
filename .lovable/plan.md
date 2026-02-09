
# Separacao de Dados nos Dashboards: Escritorio e Obras

## Resumo

O Dashboard Escritorio deve focar exclusivamente em dados administrativos da empresa (fluxo de caixa, leads, orcamentos). O Dashboard Obras deve focar em operacao de campo e receber uma sub-aba com dados financeiros dos projetos em execucao.

---

## Alteracoes no Dashboard Escritorio

**Remover:**
- Secao "Pipeline de Projetos" (linhas 317-345) — cards com projetos recentes e status
- Secao "Pagamentos da Semana" (linhas 347-385) — lista de pagamentos por fornecedor

**Substituir por:**
- **Leads do Mes** — resumo de leads por status (novo, contato feito, proposta enviada, fechado) com contagem
- **Propostas Recentes** — lista das ultimas propostas com status (rascunho, enviada, aprovada, rejeitada) e valor

Os dados mock existentes (`recentProjects`, `upcomingPayments`) serao removidos e substituidos por dados mock de leads e propostas.

**Manter sem alteracao:**
- Cards de resumo financeiro (Fluxo de Caixa, Pagamentos Pendentes, Orcado vs Recebido, Projetos Ativos)
- Alertas urgentes
- Graficos (Fluxo de Pagamentos, Orcamentos por Status, Receitas vs Despesas)
- Resumo Financeiro final (Total Orcado, Recebido, A Receber)

---

## Alteracoes no Dashboard Obras

**Adicionar sub-abas com Tabs:**
- **Aba "Operacional"** (padrao) — conteudo atual completo (progresso, cronograma, pendencias, compras, proximas etapas)
- **Aba "Financeiro das Obras"** (nova) — dados financeiros por projeto em execucao

**Conteudo da nova aba "Financeiro das Obras":**
- Cards resumo: Total Orcado (soma projetos ativos), Total Pago, Saldo Pendente
- Tabela por projeto: Nome, Orcamento Contratado, Total Pago, % Executado Financeiramente, Status (em dia / alerta / atrasado)
- Lista de proximos pagamentos por fornecedor (exatamente o que foi removido do Escritorio, porem contextualizado aqui como dados de obra)

---

## Detalhes Tecnicos

### Arquivos a modificar:
- `src/pages/DashboardEscritorio.tsx`
- `src/pages/DashboardObras.tsx`

### DashboardEscritorio.tsx:
- Remover imports nao usados (`Briefcase`)
- Remover constantes: `recentProjects`, `upcomingPayments`, `statusLabels`
- Adicionar constantes mock: `leadsDoMes`, `propostasRecentes`
- Substituir o grid inferior (Pipeline + Pagamentos) por grid (Leads + Propostas)

### DashboardObras.tsx:
- Importar `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` do shadcn
- Envolver conteudo atual na aba "Operacional"
- Criar aba "Financeiro" com:
  - 3 cards de resumo (Total Orcado, Pago, Pendente) usando paleta AZUL
  - Tabela de projetos com barras de progresso financeiro
  - Lista de pagamentos proximos (com mock data similar ao que foi removido do Escritorio)
- Importar `Table, TableHeader, TableRow, TableHead, TableBody, TableCell`

### Dados mock:
Ambos continuam com dados mock por enquanto (consistente com o estado atual). Os dados serao conectados ao banco em uma fase futura.
