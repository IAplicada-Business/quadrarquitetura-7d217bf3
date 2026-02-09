
# Limpar Dados Mockados dos Dashboards

## Problema

Os 3 dashboards (`Dashboard.tsx`, `DashboardEscritorio.tsx`, `DashboardObras.tsx`) usam dados hardcoded (mockados) para todas as metricas, graficos, listas e alertas. Isso impede que o sistema reflita a realidade do banco de dados.

## O que sera feito

Substituir todos os dados mockados por consultas reais ao banco de dados, mantendo a mesma estrutura visual dos paineis. Quando nao houver dados, os paineis continuam visiveis com estados vazios (zeros, graficos sem barras, listas com mensagem "Nenhum dado").

## Alteracoes

### 1. `src/pages/Dashboard.tsx` -- Remover

Este arquivo nao e usado (o roteamento redireciona `/dashboard` para `/dashboard/escritorio`). Sera removido para evitar confusao.

### 2. `src/pages/DashboardEscritorio.tsx` -- Reescrever com dados reais

Substituir todos os blocos de mock data por queries reais:

**Cards de Resumo:**
- "Fluxo de Caixa" -- soma de `payments` com `status=pago` do mes atual
- "Pagamentos Pendentes" -- contagem e soma de `payments` com `status=pendente` e `due_date` na semana
- "Orcado vs Recebido" -- soma de `estimated_budget` de projetos ativos vs pagos
- "Projetos Ativos" -- contagem de projetos com `status != concluido`

**Alertas ("Atencao Necessaria"):**
- Query em `payments` com `status=pendente` e `due_date < hoje` (atrasados)
- Query em `budget_quotes` com `status=cotado` e criados ha mais de 5 dias sem resposta

**Graficos:**
- Fluxo de Pagamentos: agrupa `payments` por mes, somando por `status`
- Orcamentos por Status: agrupa `budget_quotes` por `status`, somando valores
- Receitas vs Despesas: agrupa `payments` por mes com tipo (receita/despesa)

**Leads e Propostas:**
- Query real em `leads` agrupando por `status`
- Query real em `proposals` ordenando por `created_at` desc, limit 4

**Resumo Financeiro:**
- Total Orcado = soma `estimated_budget` dos projetos
- Recebido = soma `payments` com `status=pago`
- A Receber = soma `payments` com `status=pendente`

### 3. `src/pages/DashboardObras.tsx` -- Reescrever com dados reais

**Aba Operacional:**

**Cards de Resumo:**
- "Obras em Execucao" -- projetos com `status=execucao`
- "Pendencias Abertas" -- contagem de `pending_items` com `status != concluido`
- "Compras Pendentes" -- contagem de `material_tracking` com `status=necessario`
- "Etapas da Semana" -- contagem de `schedule_tasks` com `start_date` na semana atual

**Progresso dos Projetos:**
- Query projetos ativos com join em `schedule_tasks`, calculando % de tarefas `executado`

**Cronograma Semanal:**
- Query `schedule_tasks` da semana atual, agrupando por dia da semana

**Pendencias por Obra:**
- Query `pending_items` agrupados por `project_id`, com join no nome do projeto

**Compras & Materiais:**
- Query `material_tracking` com join em projetos, mostrando status

**Proximas Etapas:**
- Query `schedule_tasks` com `start_date >= hoje` ordenado por data, limit 5

**Aba Financeiro das Obras:**

**Cards de resumo:**
- Total Orcado = soma `estimated_budget`
- Total Pago = soma `payments` com `status=pago`
- Saldo = diferenca

**Tabela por obra:**
- Projetos ativos com orcamento, valor pago, saldo e status (calculados)

**Pagamentos proximos:**
- Query `payments` com `due_date` proximos, ordenados por data

---

## Detalhes Tecnicos

### Hooks a criar
Nenhum hook novo. As queries serao feitas inline nos componentes usando `useQuery` do TanStack, seguindo o padrao ja existente no projeto.

### Tratamento de estado vazio
Cada secao tera um estado vazio elegante:
- Cards de metricas: mostram "0" ou "R$ 0"
- Graficos: mostram eixos sem barras/areas
- Listas: mostram "Nenhum registro encontrado"
- Alertas: secao oculta quando nao ha alertas

### Queries principais (todas com `.eq("user_id", user.id)`)

```text
-- Projetos ativos
supabase.from("projects").select("*").neq("status", "concluido")

-- Pagamentos
supabase.from("payments").select("*, projects(name)").eq("user_id", user.id)

-- Budget quotes
supabase.from("budget_quotes").select("*, scope_items(discipline)").eq("user_id", user.id)

-- Schedule tasks (sem user_id filter, filtra por project)
supabase.from("schedule_tasks").select("*, projects(name)")

-- Pending items
supabase.from("pending_items").select("*, projects(name)")

-- Material tracking
supabase.from("material_tracking").select("*, projects(name)")

-- Leads
supabase.from("leads").select("*")

-- Proposals
supabase.from("proposals").select("*, leads(name)")
```

### Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/Dashboard.tsx` | Remover (nao usado) |
| `src/pages/DashboardEscritorio.tsx` | Reescrever -- trocar mock data por queries reais |
| `src/pages/DashboardObras.tsx` | Reescrever -- trocar mock data por queries reais |
