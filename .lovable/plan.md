
# Reestruturacao das Abas Materiais e Cronograma

## Contexto

As abas Materiais e Cronograma existem mas sao basicas. O pedido exige que ambas sejam fortemente conectadas ao Orcamento, com visoes distintas (interna vs cliente) no cronograma e integracao de compras dentro de materiais.

---

## Parte 1: Migracao de Banco de Dados

Adicionar colunas na tabela `material_tracking` para suportar disciplina, unidade, fornecedor e link de compra:

```sql
ALTER TABLE material_tracking
  ADD COLUMN IF NOT EXISTS discipline TEXT,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS product_link TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS budget_quote_id UUID;
```

A coluna `source` indica se o material veio do orcamento (`orcamento`) ou foi inserido manualmente (`manual`). `budget_quote_id` vincula ao orcamento aprovado de origem.

A tabela `schedule_tasks` ja possui as colunas necessarias: `discipline`, `supplier_name`, `is_daily_detail`, `is_client_visible`, `requires_presence`, `progress_percentage`, `color`.

---

## Parte 2: Aba MATERIAIS (reescrita completa)

**Arquivo:** `src/components/projects/ProjectMaterialsTab.tsx`

Reestruturar com 3 sub-secoes em tabs internas:

### 2.1 Sub-aba "Rastreamento" (visao principal)

- Tabela com colunas: Material, Disciplina, Unid., Necessario, Comprado, Entregue, Usado, Fornecedor, Acoes
- Barra de progresso visual por linha (comprado/necessario)
- Filtros: por disciplina, por status (pendente de compra, comprado, entregue), por fornecedor
- Botao "Gerar Compra" em cada linha para criar entrada na tabela `purchases`
- Botao "Importar do Orcamento" que puxa itens dos orcamentos aprovados (`budget_quotes` com `status=aprovado`) e cria entradas automaticamente no `material_tracking`
- Inserir material manual continua disponivel como opcao secundaria
- Cards de metricas no topo: Total de Itens, Pendentes de Compra, Entregues, % Completo

### 2.2 Sub-aba "Memoria de Calculo"

- Manter a funcionalidade existente (tabela de calculo por categoria)
- Adicionar texto explicativo sobre as regras vindas de Configuracoes
- Mostrar os parametros de calculo ativos (do hook `useCalculationParameters`)
- Permitir sobrescrever calculo por item

### 2.3 Sub-aba "Compras" (embutida, nao separada)

- Reutilizar `ProjectPurchasesTab` existente como sub-componente
- Adicionar botao "Gerar Lista por Fornecedor" que agrupa itens de compra por fornecedor e exibe em formato copiavel/compartilhavel
- Funcionalidade de lista compartilhavel (copiar texto formatado com itens agrupados por fornecedor)

**Hooks alterados:**
- `src/hooks/useMaterialTracking.ts`: Adicionar campos `discipline`, `unit`, `supplier_name`, `product_link`, `source`, `budget_quote_id` no create/update
- Adicionar mutation `importFromBudget` que busca `budget_quotes` aprovadas com `material_estimate > 0`, cria entradas no `material_tracking` com `source='orcamento'`

**Form alterado:**
- `src/components/projects/MaterialTrackingForm.tsx`: Adicionar campos Disciplina (select com disciplinas do escopo), Unidade, Fornecedor, Link de Compra

---

## Parte 3: Aba CRONOGRAMA (reescrita completa)

**Arquivo:** `src/components/projects/ProjectScheduleTab.tsx`

Reestruturar com visoes distintas:

### 3.1 Visao Interna - Gantt Diario

- Grafico de Gantt horizontal construido com CSS/divs (sem dependencia externa)
- Granularidade diaria com navegacao por semana/mes
- Cada barra mostra: nome da tarefa, responsavel/fornecedor, cor por disciplina, progresso %
- Filtros: por data (hoje, esta semana, este mes), por fornecedor, por disciplina
- Tarefas com `is_daily_detail=true` aparecem como detalhamento fino
- Indicador de "requer presenca" (icone) para tarefas onde a arquiteta precisa estar
- Acoes: editar, excluir, alterar status inline

### 3.2 Visao Cliente - Blocos Semanais

- Visao simplificada com blocos grandes por semana
- Agrupa tarefas onde `is_client_visible=true` em fases semanais
- Visual limpo e profissional com cores por disciplina
- Botao "Exportar" que gera versao HTML bonita para compartilhar (copia HTML formatado)
- Mostra apenas marcos principais (semanas com nomes de fase)

### 3.3 Pendencias (integrada no cronograma)

- Manter `ProjectPendingTab` como sub-aba dentro do cronograma (ja existe)

**Form alterado:**
- `src/components/projects/ScheduleTaskForm.tsx`: Adicionar campos:
  - Fornecedor/Responsavel (`supplier_name`)
  - Disciplina direta (texto, alem do scope_item_id)
  - Visivel para cliente (`is_client_visible` - checkbox)
  - Detalhe diario (`is_daily_detail` - checkbox)
  - Requer presenca (`requires_presence` - checkbox)
  - Progresso % (`progress_percentage` - slider)
  - Cor (`color` - select de cores)

---

## Parte 4: Conexoes entre Abas

### Orcamento -> Materiais
- Botao "Importar do Orcamento" na aba Materiais busca cotacoes aprovadas e cria entradas de rastreamento

### Materiais -> Compras
- Botao "Gerar Compra" em cada material cria item na tabela `purchases` vinculado

### Orcamento/Escopo -> Cronograma
- As disciplinas do escopo contratado alimentam o seletor de disciplinas no form de tarefas

---

## Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| Migracao SQL | Adicionar colunas em `material_tracking` |
| `src/components/projects/ProjectMaterialsTab.tsx` | Reescrever - 3 sub-abas com filtros, importacao, metricas |
| `src/components/projects/MaterialTrackingForm.tsx` | Editar - novos campos (disciplina, unidade, fornecedor, link) |
| `src/hooks/useMaterialTracking.ts` | Editar - novos campos + mutation importFromBudget |
| `src/components/projects/ProjectScheduleTab.tsx` | Reescrever - Gantt interno + visao cliente + pendencias |
| `src/components/projects/ScheduleTaskForm.tsx` | Editar - novos campos (fornecedor, visibilidade, progresso, cor) |
| `src/components/projects/GanttChart.tsx` | Novo - componente de Gantt com CSS |
| `src/components/projects/ClientScheduleView.tsx` | Novo - visao simplificada por semana para cliente |
| `src/components/projects/SupplierPurchaseList.tsx` | Novo - lista agrupada por fornecedor para compartilhar |

---

## Detalhes Tecnicos

### Gantt Chart (CSS puro)
- Container com grid de dias (colunas) e tarefas (linhas)
- Calcula posicao/largura das barras baseado em `start_date` e `end_date` relativo ao range visivel
- Navegacao: botoes "Semana Anterior / Proxima" e "Mes Anterior / Proximo"
- Scroll horizontal para periodos longos
- Cores por disciplina usando palette fixa

### Visao Cliente
- Agrupa tarefas por semana (ISO week)
- Mostra blocos coloridos com nome da fase/disciplina
- Layout em cards com visual clean
- Botao de copiar gera HTML estilizado inline para colar em email/WhatsApp

### Importacao do Orcamento
- Busca `budget_quotes` com `status='aprovado'` e `material_estimate > 0`
- Para cada cotacao aprovada, cria registro em `material_tracking` com:
  - `material_name` = disciplina + " (material)"
  - `quantity_needed` = baseado em estimativa
  - `discipline` = disciplina do scope_item vinculado
  - `source` = 'orcamento'
  - `budget_quote_id` = id da cotacao
- Verifica duplicatas antes de importar (nao reimporta o que ja tem `budget_quote_id`)
