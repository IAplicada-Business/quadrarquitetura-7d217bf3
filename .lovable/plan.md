

# Modulo de Orcamentos e Gestao de Obra -- Plano de Implementacao

Este e um projeto de grande escala que precisa ser dividido em fases para garantir qualidade e funcionalidade. O plano abaixo cobre **Fase 1** (implementacao imediata) com as bases para as fases seguintes.

---

## Visao Geral da Arquitetura

A implementacao centraliza tudo na **pagina de detalhe do projeto** (`/projects/:id`), com abas navegaveis. A pagina de listagem de projetos (`/projects`) tera CRUD completo. Cada aba do detalhe do projeto tera seu proprio componente.

### Estrutura de Pastas (novos arquivos)

```text
src/pages/
  Projects.tsx                    (refatorar - listagem com CRUD)
  ProjectDetail.tsx               (NOVO - pagina de detalhe com abas)

src/components/projects/
  ProjectForm.tsx                 (formulario criar/editar projeto)
  ProjectSummaryTab.tsx           (aba Resumo)
  ProjectScopeTab.tsx             (aba Escopo)
  ProjectBudgetsTab.tsx           (aba Orcamentos)
  ProjectMaterialsTab.tsx         (aba Materiais)
  ProjectPurchasesTab.tsx         (aba Compras)
  ProjectScheduleTab.tsx          (aba Cronograma)
  ProjectPendingTab.tsx           (aba Pendencias)
  ProjectFinancialTab.tsx         (aba Financeiro)
  ProjectDocumentsTab.tsx         (aba Documentos)
  ProjectTrackingTab.tsx          (aba Acompanhamento - placeholder)
```

---

## Fase 1 -- Banco de Dados (Migracoes SQL)

### 1.1 Novas Tabelas

**scope_items** -- Disciplinas do escopo da obra:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID PK | |
| user_id | UUID FK auth.users | Dono |
| project_id | UUID FK projects | Projeto |
| discipline | TEXT | Nome da disciplina (Alvenaria, Gesso, etc.) |
| description | TEXT | Descricao dos servicos |
| suppliers_to_quote | TEXT | Fornecedores a serem orcados |
| payment_terms | TEXT | Forma de pagamento |
| entry_order | INTEGER | Ordem de entrada na obra |
| service_duration | TEXT | Tempo medio de servico |
| parent_id | UUID FK scope_items | Para subdivisoes (nullable) |
| created_at / updated_at | TIMESTAMPTZ | |

**budget_quotes** -- Orcamentos por disciplina/fornecedor (substitui uso atual da tabela budgets):

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID PK | |
| user_id | UUID FK | |
| project_id | UUID FK | |
| scope_item_id | UUID FK scope_items | Disciplina vinculada |
| supplier_id | UUID FK suppliers (nullable) | Fornecedor |
| supplier_name | TEXT | Nome livre se nao cadastrado |
| services_description | TEXT | O que esta sendo cotado |
| value | NUMERIC | Valor do servico |
| material_estimate | NUMERIC | Estimativa de material |
| delivery_time | TEXT | Prazo |
| payment_terms | TEXT | Forma pagamento |
| status | budget_status | pendente/cotado/aprovado/rejeitado |
| revision | TEXT DEFAULT 'Rev 1' | Revisao |
| revision_number | INTEGER DEFAULT 1 | Numero da revisao |
| is_current_revision | BOOLEAN DEFAULT true | Se e a revisao vigente |
| created_at / updated_at | TIMESTAMPTZ | |

**material_calculations** -- Memoria de calculo:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID PK | |
| user_id | UUID FK | |
| project_id | UUID FK | |
| category | TEXT | Tijolos, Revestimentos, Eletrica, etc. |
| item_name | TEXT | Nome do item |
| unit | TEXT | m2, un, m3, saco, etc. |
| quantity | NUMERIC | Quantidade calculada |
| parameters | JSONB | Parametros do calculo (area, fator perda, etc.) |
| notes | TEXT | Observacoes |
| linked_purchase_id | UUID FK purchases (nullable) | Vinculo com compra |
| created_at / updated_at | TIMESTAMPTZ | |

**material_tracking** -- Rastreamento de materiais:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID PK | |
| user_id | UUID FK | |
| project_id | UUID FK | |
| material_name | TEXT | Nome do material |
| quantity_needed | NUMERIC | Quantidade necessaria |
| quantity_purchased | NUMERIC DEFAULT 0 | Comprado |
| quantity_delivered | NUMERIC DEFAULT 0 | Entregue |
| quantity_used | NUMERIC DEFAULT 0 | Usado |
| purchase_date | DATE | |
| delivery_date | DATE | |
| notes | TEXT | |
| created_at / updated_at | TIMESTAMPTZ | |

**invoices** -- Notas fiscais:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID PK | |
| user_id | UUID FK | |
| project_id | UUID FK | |
| invoice_number | TEXT | Numero sequencial |
| store_name | TEXT | Lugar/loja |
| category | TEXT | Categoria (obra civil, eletrica, tintas, etc.) |
| value | NUMERIC | Valor |
| file_url | TEXT | URL do arquivo (foto/PDF) |
| description | TEXT | Descricao |
| created_at / updated_at | TIMESTAMPTZ | |

**schedule_tasks** -- Cronograma de obra:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID PK | |
| user_id | UUID FK | |
| project_id | UUID FK | |
| scope_item_id | UUID FK scope_items (nullable) | Disciplina vinculada |
| task_name | TEXT | Nome da etapa |
| start_date | DATE | Inicio planejado |
| end_date | DATE | Fim planejado |
| status | TEXT DEFAULT 'planejado' | planejado/em_execucao/executado/atrasado |
| payment_note | TEXT | Nota de pagamento (ex: "PAGAMENTO 50%") |
| order_index | INTEGER | Ordem no cronograma |
| created_at / updated_at | TIMESTAMPTZ | |

**pending_items** -- Lista de pendencias:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID PK | |
| user_id | UUID FK | |
| project_id | UUID FK | |
| discipline | TEXT | Categoria relacionada |
| description | TEXT | O que precisa ser feito |
| responsible | TEXT | Quem vai resolver |
| status | TEXT DEFAULT 'pendente' | pendente/em_andamento/resolvido |
| inclusion_date | DATE DEFAULT CURRENT_DATE | |
| conclusion_date | DATE | |
| created_at / updated_at | TIMESTAMPTZ | |

### 1.2 Alteracoes em Tabelas Existentes

**purchases** -- Adicionar colunas:

- `supplier_name` TEXT -- local/onde comprar
- `deadline` DATE -- data limite de compra
- `payment_info` TEXT -- dados para pagamento
- `specifications` TEXT -- detalhes tecnicos
- `material_calc_id` UUID FK material_calculations -- vinculo com memoria de calculo

**payments** -- Adicionar colunas:

- `budget_quote_id` UUID FK budget_quotes -- vinculo com orcamento aprovado
- `installment_number` INTEGER -- numero da parcela
- `total_installments` INTEGER -- total de parcelas
- `paid_date` DATE -- data efetiva do pagamento

### 1.3 Enum e Novo Tipo

- Adicionar novo valor ao `purchase_status`: nenhum novo necessario (pendente/comprado/entregue/instalado ja cobre)
- Criar storage bucket `project-files` para notas fiscais e documentos

### 1.4 RLS Policies

Todas as novas tabelas terao RLS habilitado com politicas identicas ao padrao existente:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

---

## Fase 2 -- Rotas e Navegacao

### 2.1 Novas Rotas no App.tsx

```text
/projects          -> Listagem de projetos (CRUD)
/projects/:id      -> Detalhe do projeto (abas)
```

### 2.2 Sidebar

Os menus de Orcamentos, Compras e Pagamentos globais continuam existindo como atalhos, mas o fluxo principal e pelo detalhe do projeto.

---

## Fase 3 -- Pagina de Listagem de Projetos

Refatorar `Projects.tsx` com:
- Tabela com projetos do usuario (nome, cliente, status, tipo, datas)
- Botao "Novo Projeto" abre dialog com formulario
- Clicar no projeto navega para `/projects/:id`
- Filtros por status e tipo
- Badge colorido para cada status do pipeline

---

## Fase 4 -- Pagina de Detalhe do Projeto (ProjectDetail.tsx)

Componente principal com:
- Cabecalho: nome do projeto, cliente, status, endereco
- Sistema de abas (Tabs do Radix) com 10 abas:

```text
Resumo | Escopo | Orcamentos | Materiais | Compras | Cronograma | Pendencias | Financeiro | Documentos | Acompanhamento
```

### 4.1 Aba Resumo
- Dados gerais do projeto (editavel inline)
- Cards com totais: orcamento estimado vs real, pendencias abertas, proximos pagamentos
- Link para cliente vinculado

### 4.2 Aba Escopo
- Tabela editavel de disciplinas
- Adicionar nova disciplina (dialog ou inline)
- Subdivisoes com indentacao visual
- Arrastar para reordenar (ou campo numerico)
- Campos: disciplina, descricao, fornecedores, pagamento, ordem, tempo

### 4.3 Aba Orcamentos
- Agrupado por disciplina (do escopo)
- Cada disciplina mostra fornecedores cotados em cards comparativos
- Botao "Adicionar Cotacao" por disciplina
- Destaque visual no fornecedor aprovado (borda verde)
- Linha de estimativa de material por disciplina
- Subtotal por disciplina (fornecedor aprovado + material)
- Total geral no rodape
- Seletor de revisao (Rev 1, Rev 2...) com botao "Nova Revisao"
- Secao de Prioridades: lista reordenavel com valor acumulado, toggle para priorizar/desprioritizar

### 4.4 Aba Materiais
- Sub-abas: Memoria de Calculo | Rastreamento
- Memoria: tabela por categoria com campos de calculo, formulas, quantidades
- Rastreamento: tabela com colunas necessario/comprado/entregue/usado com datas

### 4.5 Aba Compras
- Tabela com todos os itens de compra do projeto
- Status visual (badge colorido)
- Botao para gerar itens a partir da memoria de calculo
- Campos: material, local, valor, data limite, pagamento, status, especificacoes

### 4.6 Aba Cronograma
- Visualizacao semanal em grade (Gantt simplificado)
- Linhas = etapas agrupadas por disciplina
- Colunas = dias agrupados por semana
- Cores: cinza (planejado), azul (em execucao), verde (executado), vermelho (atrasado)
- Indicadores de pagamento
- CRUD de tarefas com dialog

### 4.7 Aba Pendencias
- Tabela com filtros por status e disciplina
- CRUD inline ou dialog
- Contador de pendencias abertas no badge da aba

### 4.8 Aba Financeiro
- Sub-abas: Pagamentos | Notas Fiscais
- Pagamentos: agrupado por fornecedor/disciplina, parcelas com status
- Botao "Gerar Parcelas" a partir de orcamento aprovado
- Notas Fiscais: tabela agrupada por categoria, subtotais, upload de arquivo

### 4.9 Aba Documentos
- Lista de documentos vinculados ao projeto
- Upload e categorizacao

### 4.10 Aba Acompanhamento
- Placeholder (check-in, fotos, relatorios -- futuro)

---

## Fase 5 -- Fluxo entre Modulos

Conexoes automaticas implementadas:
1. Criar disciplina no Escopo -> aparece automaticamente na aba Orcamentos
2. Aprovar orcamento -> botao "Gerar Parcelas" na aba Financeiro
3. Adicionar item na Memoria de Calculo -> botao "Enviar para Compras"
4. Atualizar compra para "entregue" -> atualiza rastreamento de materiais

---

## Detalhes Tecnicos

### Componentes Novos (estimativa ~25 arquivos)

1. `src/pages/ProjectDetail.tsx` -- Pagina principal com abas
2. `src/components/projects/ProjectForm.tsx` -- Form criar/editar
3. `src/components/projects/ProjectSummaryTab.tsx`
4. `src/components/projects/ProjectScopeTab.tsx`
5. `src/components/projects/ScopeItemForm.tsx`
6. `src/components/projects/ProjectBudgetsTab.tsx`
7. `src/components/projects/BudgetQuoteCard.tsx`
8. `src/components/projects/BudgetQuoteForm.tsx`
9. `src/components/projects/PriorityList.tsx`
10. `src/components/projects/ProjectMaterialsTab.tsx`
11. `src/components/projects/MaterialCalcForm.tsx`
12. `src/components/projects/MaterialTrackingTable.tsx`
13. `src/components/projects/ProjectPurchasesTab.tsx`
14. `src/components/projects/PurchaseForm.tsx`
15. `src/components/projects/ProjectScheduleTab.tsx`
16. `src/components/projects/ScheduleGrid.tsx`
17. `src/components/projects/ScheduleTaskForm.tsx`
18. `src/components/projects/ProjectPendingTab.tsx`
19. `src/components/projects/PendingItemForm.tsx`
20. `src/components/projects/ProjectFinancialTab.tsx`
21. `src/components/projects/PaymentInstallments.tsx`
22. `src/components/projects/InvoiceTable.tsx`
23. `src/components/projects/InvoiceForm.tsx`
24. `src/components/projects/ProjectDocumentsTab.tsx`
25. `src/components/projects/ProjectTrackingTab.tsx`

### Hooks Reutilizaveis

- `useProjectDetail(id)` -- Carrega dados do projeto
- `useScopeItems(projectId)` -- CRUD de escopo
- `useBudgetQuotes(projectId)` -- CRUD de orcamentos
- `useMaterialCalc(projectId)` -- CRUD de memoria de calculo
- `useProjectPurchases(projectId)` -- CRUD de compras do projeto
- `useScheduleTasks(projectId)` -- CRUD do cronograma
- `usePendingItems(projectId)` -- CRUD de pendencias
- `useProjectPayments(projectId)` -- CRUD de pagamentos do projeto
- `useInvoices(projectId)` -- CRUD de notas fiscais

### Storage

Criar bucket `project-files` (publico) para:
- Notas fiscais (fotos/PDF)
- Documentos do projeto

### Padrao de Design

- Seguir o design system existente (azul #1F4E79 = primary, rosa suave = secondary/accent)
- Fontes: Playfair Display (titulos) + Inter (corpo)
- Cards com sombra suave, badges coloridos para status
- Dialogs para formularios, tabelas para listagens
- Animacoes com `animate-fade-in` do Tailwind

---

## Ordem de Implementacao (na aprovacao)

Dado o tamanho, a implementacao sera feita na seguinte ordem:

1. **Migracao SQL** -- Criar todas as tabelas novas, alterar existentes, criar bucket
2. **Rota e ProjectDetail** -- Estrutura da pagina com abas vazias
3. **Projects listagem** -- CRUD completo com navegacao
4. **Aba Resumo** -- Dados gerais do projeto
5. **Aba Escopo** -- CRUD de disciplinas
6. **Aba Orcamentos** -- Cotacoes, comparacao, revisoes, prioridades
7. **Aba Materiais** -- Memoria de calculo + rastreamento
8. **Aba Compras** -- Lista de compras com vinculo
9. **Aba Cronograma** -- Grade semanal
10. **Aba Pendencias** -- CRUD simples
11. **Aba Financeiro** -- Pagamentos + notas fiscais
12. **Aba Documentos** -- Upload e listagem
13. **Aba Acompanhamento** -- Placeholder

Devido ao volume, recomendo implementar os itens 1-6 nesta rodada e os demais em rodadas subsequentes para garantir qualidade.

