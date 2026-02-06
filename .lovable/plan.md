

# Melhorias no Fluxo de Preenchimento e Dados -- Analise Comparativa

Apos analisar detalhadamente as planilhas reais (Q113 e Q121) e comparar com a implementacao atual do sistema, identifiquei problemas criticos no modelo de dados e 6 abas que ainda sao placeholders. Segue o plano completo de melhorias.

---

## Problemas Identificados

### 1. Orcamentos -- Modelo de dados incorreto

**Como funciona na planilha:**
- Um fornecedor pode ter MULTIPLOS itens com valores separados (ex: Templuz cotou Sala R$4.842 + Corredor R$405 + Escada R$3.912 = total do fornecedor)
- A "Estimativa de material" e uma linha SEPARADA por disciplina, nao um campo de cada cotacao
- O "Valor da disciplina" = fornecedor aprovado (soma dos itens) + estimativa de material da disciplina

**Como esta no sistema:**
- Cada cotacao tem apenas 1 campo `value` (nao suporta multiplos itens)
- `material_estimate` esta dentro de cada cotacao de fornecedor (errado -- deveria ser por disciplina)

### 2. Seis abas ainda sao placeholders
- Materiais, Compras, Cronograma, Pendencias, Financeiro, Documentos

### 3. Campos faltantes na aba Resumo
- Links de acesso (contratos, NFs/boletos, relatorios) -- presentes na planilha "Inicio"
- Percentual de imprevistos (5%) sobre o valor total

### 4. Reuniao de Prioridades
- Interface de reordenacao por prioridade nao implementada

---

## Plano de Implementacao

### Fase 1 -- Corrigir modelo de Orcamentos

**Nova tabela `budget_quote_items`:**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID PK | |
| user_id | UUID | Dono |
| budget_quote_id | UUID FK | Cotacao pai |
| description | TEXT | Descricao do item (ex: "Sala+cozinha", "Corredor") |
| value | NUMERIC | Valor do item |
| created_at / updated_at | TIMESTAMPTZ | |

Isso permite que um fornecedor tenha multiplas linhas de orcamento (como Templuz com 12 ambientes).

**Nova tabela `discipline_material_estimates`:**

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID PK | |
| user_id | UUID | |
| scope_item_id | UUID FK scope_items | Disciplina |
| project_id | UUID FK | |
| description | TEXT | Descricao do material |
| value | NUMERIC | Valor estimado |
| revision_number | INTEGER DEFAULT 1 | Revisao |
| created_at / updated_at | TIMESTAMPTZ | |

Isso separa a estimativa de material da cotacao do fornecedor.

**Alteracao em `budget_quotes`:**
- O campo `value` passa a ser calculado (soma dos items) ou mantido para cotacoes simples sem detalhamento
- Remover `material_estimate` (migrar para tabela separada)

**Refatoracao da aba Orcamentos:**
- Cada disciplina mostra: fornecedores cotados (cards com lista de itens) + linha de estimativa de material
- Subtotal por disciplina = fornecedor aprovado + estimativa material
- Total geral no rodape com opcao de "+ X% imprevistos"

### Fase 2 -- Aba Materiais (funcional)

Substituir o placeholder por duas sub-abas:

**Sub-aba "Memoria de Calculo":**
- Tabela agrupada por categoria (Tijolos, Revestimentos, Argamassa, Reboco, Contrapiso, Eletrica, Pintura)
- Campos por item: nome, parametros (area, fator perda, desconto vaos), quantidade calculada, unidade, observacoes
- Os parametros sao armazenados em JSONB para flexibilidade (cada categoria tem parametros diferentes)
- Botao "Enviar para Compras" que cria itens na lista de compras
- Hook: `useMaterialCalc(projectId)` com CRUD completo

**Sub-aba "Rastreamento de Materiais":**
- Tabela com colunas: Material, Qtd Necessaria, Qtd Comprada + Data, Qtd Entregue + Data, Qtd Usada
- Campo de observacoes para "compras avulsas" e "servicos adicionados" (como na planilha real)
- Hook: `useMaterialTracking(projectId)` com CRUD

### Fase 3 -- Aba Compras (funcional)

- Tabela com campos: Material/Servico, Local, Valor, Data Limite, Dados Pagamento, Status, Especificacoes
- Status com badges coloridos: a comprar (amarelo), comprado (azul), entregue (verde)
- Coluna "Especificacoes" com texto expandivel (tooltip ou modal) para detalhes tecnicos longos
- Pode ser alimentada manualmente ou via botao "Enviar para Compras" da memoria de calculo
- Hook: `useProjectPurchases(projectId)` com CRUD

### Fase 4 -- Aba Pendencias (funcional)

- Tabela com campos: Status, Disciplina, Descricao, Responsavel, Data Inclusao, Data Conclusao
- Filtros por status (pendente/em andamento/resolvido) e por disciplina
- Status com badges: pendente (vermelho), em andamento (amarelo), resolvido (verde)
- Contador de pendencias abertas visivel no cabecalho
- Hook: `usePendingItems(projectId)` com CRUD

### Fase 5 -- Aba Financeiro (funcional)

Duas sub-abas:

**Sub-aba "Pagamentos":**
- Tabela agrupada por disciplina/fornecedor
- Cada linha: valor da parcela, status (pago/pendente), data vencimento, data pagamento
- Resumo: total pago, total pendente, proximo vencimento
- Botao "Gerar Parcelas" que cria parcelas a partir de orcamento aprovado + forma de pagamento
- Hook: `useProjectPayments(projectId)` com CRUD

**Sub-aba "Notas Fiscais":**
- Tabela agrupada por categoria (Obra Civil, Eletrica, Diversos, Tintas -- como na planilha)
- Campos: Item (numero), Lugar (loja), Descricao (categoria), Valor
- Subtotal por categoria + total geral
- Upload de foto/PDF da NF
- Hook: `useInvoices(projectId)` com CRUD

### Fase 6 -- Aba Cronograma (funcional)

- Visualizacao simplificada em tabela (nao Gantt completo nesta fase)
- Linhas: etapas numeradas agrupadas por disciplina
- Colunas: nome da etapa, data inicio, data fim, status, nota de pagamento
- Status com cores: cinza (planejado), azul (em execucao), verde (executado), vermelho (atrasado)
- CRUD de tarefas via dialog
- Hook: `useScheduleTasks(projectId)` com CRUD

### Fase 7 -- Aba Documentos (funcional)

- Upload de arquivos para o bucket `project-files`
- Lista com: nome, categoria, tamanho, data de upload
- Categorias: Contrato, Projeto, Orcamento, NF, Outros
- Download e exclusao

### Fase 8 -- Reuniao de Prioridades

Adicionar secao na aba Orcamentos (abaixo do total):
- Lista de disciplinas com orcamento aprovado
- Campo de prioridade (numeracao 1, 2, 3...)
- Toggle para "priorizado" / "nao priorizado"
- Coluna de valor acumulado (soma progressiva conforme prioridade)
- Itens nao priorizados ficam em secao separada (nunca deletados)

**Adicionar campos na tabela `budgets` ou criar tabela `discipline_priorities`:**

| Coluna | Tipo |
|--------|------|
| id | UUID PK |
| user_id | UUID |
| project_id | UUID FK |
| scope_item_id | UUID FK |
| priority | INTEGER |
| is_prioritized | BOOLEAN DEFAULT true |
| revision_number | INTEGER |

### Fase 9 -- Melhorias na aba Resumo

- Adicionar campos de links externos: "Acesso aos relatorios", "Acesso aos contratos", "Acesso as NFs/boletos"
- Card com valor total do orcamento (puxado automaticamente da aba Orcamentos)
- Card com valor total + % imprevistos (configuravel: 5%, 10%)
- Contador de pendencias abertas

---

## Detalhes Tecnicos

### Novas Migracoes SQL
1. Criar tabela `budget_quote_items` com RLS
2. Criar tabela `discipline_material_estimates` com RLS
3. Criar tabela `discipline_priorities` com RLS
4. Remover campo `material_estimate` de `budget_quotes` (manter por compatibilidade, depreciar no codigo)

### Novos Hooks (~8 arquivos)
- `useMaterialCalc(projectId)`
- `useMaterialTracking(projectId)`
- `useProjectPurchases(projectId)`
- `usePendingItems(projectId)`
- `useProjectPayments(projectId)`
- `useInvoices(projectId)`
- `useScheduleTasks(projectId)`
- `useDisciplinePriorities(projectId)`

### Novos/Refatorados Componentes (~20 arquivos)
- Refatorar `ProjectBudgetsTab.tsx` (itens + estimativa separada + prioridades)
- Refatorar `BudgetQuoteCard.tsx` (suportar lista de itens)
- Refatorar `BudgetQuoteForm.tsx` (adicionar itens inline)
- Novo `MaterialEstimateForm.tsx`
- Novo `MaterialCalcTab.tsx` + `MaterialCalcForm.tsx`
- Novo `MaterialTrackingTab.tsx` + `MaterialTrackingForm.tsx`
- Refatorar `ProjectMaterialsTab.tsx` (sub-abas reais)
- Refatorar `ProjectPurchasesTab.tsx` (tabela funcional + form)
- Novo `PurchaseForm.tsx`
- Refatorar `ProjectPendingTab.tsx` (tabela funcional + form)
- Novo `PendingItemForm.tsx`
- Refatorar `ProjectFinancialTab.tsx` (sub-abas reais)
- Novo `PaymentTable.tsx` + `PaymentForm.tsx`
- Novo `InvoiceTable.tsx` + `InvoiceForm.tsx`
- Refatorar `ProjectScheduleTab.tsx` (tabela funcional)
- Novo `ScheduleTaskForm.tsx`
- Refatorar `ProjectDocumentsTab.tsx` (upload funcional)
- Refatorar `ProjectSummaryTab.tsx` (links + totais automaticos)
- Novo `PriorityList.tsx`

### Ordem de execucao recomendada

Dado o volume, recomendo dividir em 3 rodadas:

**Rodada 1:** Fases 1-3 (corrigir orcamentos + materiais + compras)
**Rodada 2:** Fases 4-6 (pendencias + financeiro + cronograma)
**Rodada 3:** Fases 7-9 (documentos + prioridades + resumo)

