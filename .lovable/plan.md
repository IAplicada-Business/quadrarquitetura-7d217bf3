
# Implementacao Completa: Modulo Projetos (8 abas) + Modulo Obra (4 paginas)

## Resumo do Estado Atual

O sistema ja possui as tabelas base: `projects`, `scenarios`, `scenario_items`, `scope_items`, `budget_quotes`, `purchases`, `material_calculations`, `material_tracking`, `schedule_tasks`, `payments`, `invoices`, `documents`, `suppliers`. Os componentes para as 8 abas do projeto ja existem com funcionalidade basica. Porem, ha lacunas significativas entre o que existe e o que o documento especifica.

## Lacunas Identificadas

### Banco de Dados

**Tabelas que NAO existem e precisam ser criadas:**
- `supplier_allocations` — alocacao de fornecedores em projetos
- `site_visits` — visitas de obra recorrentes
- `default_disciplines` — disciplinas padrao para cenarios (com 16 registros)
- `calculation_parameters` — parametros de calculo de materiais (com registros padrao)

**Colunas faltantes em tabelas existentes:**
- `projects`: faltam `ideal_budget`, `contingency_percentage`, `real_start_date`, `notes`, `sub_status` precisa ser revisado contra o documento
- `scope_items`: faltam `scope_type` (projeto/contratado), `activities`, `estimated_value` (ja existe no schema) — o schema atual nao tem `scope_type` nem `activities`
- `schedule_tasks`: faltam `discipline`, `supplier_name`, `is_daily_detail`, `is_client_visible`, `requires_presence`, `progress_percentage`, `color` — atualmente usa `scope_item_id`, `task_name`, `order_index`, `payment_note` com schema diferente
- `payments`: faltam `supplier_name` (campo separado), `payment_method`, `pix_key` — atualmente ja tem `pix_key` e `budget_quote_id` mas falta `supplier_name` como texto, `total_value`, `installment_value` vs `value`
- `invoices`: schema atual tem `invoice_number`, `store_name`, `category`, `value`, `file_url` — faltam `type` (deposito/compra), `date`, `receipt_image_url`
- `suppliers`: faltam `notes`, `is_active`
- `documents`: faltam `uploaded_by`, `notes`

### Frontend — Projetos

**Lista de Projetos (`/projects`):**
- Falta visao Kanban (7 colunas com drag & drop)
- Falta os novos status: briefing, estudo, projeto, planejamento, mobilizacao, execucao, concluido (atualmente usa: proposta, contrato, projeto, planejamento, mobilizacao, execucao, concluido)

**Aba Resumo:**
- Faltam indicadores dinamicos (cotacoes aprovadas X de Y, tarefas concluidas, etc.)
- Falta comparacao orcamento idealizado vs contratado vs cotado vs pago com barras visuais
- Faltam links rapidos para cada aba

**Aba Cenarios:**
- Falta carregar disciplinas padrao de `default_disciplines` ao criar cenario
- Falta barra visual comparando total vs orcamento do cliente (verde/amarelo/vermelho)
- Faltam acoes Duplicar e Editar nome
- Falta automacao de preencher escopo ao aprovar (com `scope_type`)

**Aba Escopo:**
- Falta toggle Escopo do Projeto / Escopo Contratado (campo `scope_type`)
- Falta campo `activities` (lista de atividades por linha)
- Falta indicador de status de cotacao por disciplina (sem cotacao / em cotacao / aprovada)
- Falta botao "Solicitar Cotacao"

**Aba Orcamentos:**
- Falta organizacao por disciplina do escopo contratado
- Falta acao "Aprovar Cotacao" com geracao de parcelas
- Falta lista de compras embutida POR disciplina

**Aba Materiais:**
- Falta calculos automaticos com formulas por categoria (tijolos, argamassa, reboco, etc.)
- Falta botao "Enviar para Rastreamento"
- Faltam status com cores no rastreamento

**Aba Cronograma:**
- Falta visao calendario (atualmente e tabela simples)
- Falta toggle Visao Interna / Visao Cliente
- Faltam campos: `requires_presence`, `is_client_visible`, `progress_percentage`
- Falta visao semanal simplificada para cliente

**Aba Financeiro:**
- Falta sub-secao Prestacao de Contas (extrato com depositos e compras)
- Atualmente mostra "Pagamentos" e "Notas Fiscais" — precisa virar "Pagamentos" e "Prestacao de Contas"
- Falta logica de deposito vs compra com saldo
- Falta upload de foto de NF

**Aba Documentos:**
- Funciona basicamente. Falta categoria "nota_fiscal" e "outro" no dropdown.

### Frontend — Obra (4 paginas placeholder)

Todas as 4 paginas de Obra sao placeholder atualmente:

**Acompanhamento (`/construction/tracking`):**
- Precisa: tabela multi-projeto, alertas, calendario de obra, mapa de fornecedores

**Fornecedores (`/construction/suppliers`):**
- Precisa: CRUD completo, alocacao em projetos, historico, avaliacao por estrelas

**Documentos (`/construction/documents`):**
- Precisa: repositorio centralizado de TODOS os documentos de TODOS os projetos

**Relatorios (`/construction/reports`):**
- Precisa: 4 tipos de relatorio (semanal, fornecedor, contador, cliente) com geracao e PDF

---

## Plano de Implementacao (6 Fases)

### Fase 1 — Migracao de Banco de Dados

Criar todas as tabelas e colunas faltantes numa unica migracao:

1. Criar `default_disciplines` com 16 disciplinas padrao
2. Criar `calculation_parameters` com parametros padrao (tijolos, argamassa, reboco, contrapiso, pintura)
3. Criar `supplier_allocations` (supplier_id, project_id, discipline, datas, status)
4. Criar `site_visits` (project_id, visit_date, visit_type, is_recurring, recurrence_rule, etc.)
5. Adicionar colunas em `projects`: `ideal_budget`, `contingency_percentage`, `real_start_date`
6. Adicionar colunas em `scope_items`: `scope_type` (text, default 'projeto'), `activities` (text)
7. Adicionar colunas em `schedule_tasks`: `discipline`, `supplier_name`, `is_daily_detail`, `is_client_visible`, `requires_presence`, `progress_percentage`, `color`
8. Adicionar colunas em `invoices`: `type` (text), `date` (date), `receipt_image_url` (text)
9. Adicionar colunas em `suppliers`: `notes`, `is_active` (default true)
10. Adicionar colunas em `documents`: `uploaded_by`, `notes`
11. RLS para todas as novas tabelas
12. Triggers de updated_at

### Fase 2 — Aba Resumo Melhorada + Cenarios com Disciplinas Padrao

**Resumo (`ProjectSummaryTab.tsx`):**
- Secao 1: Dados do projeto com WhatsApp links
- Secao 2: Barras visuais de comparacao orcamentaria (idealizado vs contratado vs cotado vs pago)
- Secao 3: Indicadores dinamicos (disciplinas, cotacoes, materiais, tarefas, pagamentos)
- Secao 4: Links rapidos para cada aba

**Cenarios (`ProjectScenariosTab.tsx`):**
- Carregar disciplinas padrao de `default_disciplines` ao criar cenario
- Barra visual verde/amarelo/vermelho
- Acoes: duplicar, editar nome
- Automacao: ao aprovar cenario, preencher `scope_items` com `scope_type`

**Hooks:** Criar `useDefaultDisciplines.ts`, atualizar `useScenarios.ts`

### Fase 3 — Escopo com Scope Type + Orcamentos Reorganizados

**Escopo (`ProjectScopeTab.tsx`):**
- Toggle Escopo do Projeto / Escopo Contratado (filtro por `scope_type`)
- Campo `activities` como lista editavel (cada linha uma atividade)
- Indicador de status de cotacao por disciplina
- Botao "Solicitar Cotacao" que cria registro em `budget_quotes`

**Orcamentos (`ProjectBudgetsTab.tsx`):**
- Reorganizar por disciplina do escopo contratado
- Modal "Aprovar Cotacao" com geracao de parcelas (cria registros em `payments`)
- Lista de compras embutida por disciplina

**Hooks:** Atualizar `useScopeItems.ts`, `useBudgetQuotes.ts`

### Fase 4 — Materiais com Formulas + Cronograma com Calendario

**Materiais (`ProjectMaterialsTab.tsx`):**
- Memoria de Calculo: 7 categorias com formulas automaticas (tijolos, revestimentos, argamassa, reboco, contrapiso, eletrica, pintura)
- Parametros vindos de `calculation_parameters`
- Botao "Enviar para Rastreamento"
- Rastreamento com status coloridos

**Cronograma (`ProjectScheduleTab.tsx`):**
- Toggle Visao Interna / Visao Cliente
- Visao interna: calendario simples (blocos por dia/semana)
- Visao cliente: blocos semanais com barra de progresso
- Campos: requires_presence, is_client_visible, progress_percentage

**Hooks:** Criar `useCalculationParameters.ts`, atualizar `useScheduleTasks.ts`

### Fase 5 — Financeiro com Prestacao de Contas + Documentos

**Financeiro (`ProjectFinancialTab.tsx`):**
- Toggle Pagamentos / Prestacao de Contas
- Pagamentos: tabela com status, acao "Registrar Pagamento", "Gerar Mensagem de Cobranca"
- Prestacao de Contas: extrato com depositos (+) e compras (-), saldo automatico, upload de NF

**Documentos (`ProjectDocumentsTab.tsx`):**
- Adicionar categorias "nota_fiscal" e "outro"
- Campo de busca por nome

**Hooks:** Atualizar `useInvoices.ts` para suportar tipo deposito/compra

### Fase 6 — Modulo Obra (4 Paginas)

**Fornecedores (`/construction/suppliers`):**
- CRUD completo com cards
- Avaliacao por estrelas
- Filtros por categoria e status
- Modal de alocacao em projeto
- Historico de projetos

**Acompanhamento (`/construction/tracking`):**
- Cards resumo (obras ativas, visitas hoje, pagamentos semana, alertas)
- Tabela multi-projeto com progresso, pendencias, compras abertas
- Calendario de obra com visitas, tarefas, pagamentos
- Mapa de fornecedores (timeline horizontal)

**Documentos (`/construction/documents`):**
- Repositorio centralizado (mesma tabela `documents`, sem filtro fixo por projeto)
- Filtro por projeto, categoria, busca

**Relatorios (`/construction/reports`):**
- 4 cards de tipo de relatorio
- Formulario de geracao (projeto + periodo)
- Preview com dados reais
- Botao exportar PDF (window.print)

**Hooks:** Criar `useSupplierAllocations.ts`, `useSiteVisits.ts`

---

## Arquivos a Criar

- `src/hooks/useDefaultDisciplines.ts`
- `src/hooks/useCalculationParameters.ts`
- `src/hooks/useSupplierAllocations.ts`
- `src/hooks/useSiteVisits.ts`

## Arquivos a Modificar

- `src/components/projects/ProjectSummaryTab.tsx` (indicadores, barras, links)
- `src/components/projects/ProjectScenariosTab.tsx` (disciplinas padrao, barra visual, duplicar)
- `src/components/projects/ProjectScopeTab.tsx` (toggle scope_type, activities, indicadores)
- `src/components/projects/ProjectBudgetsTab.tsx` (por disciplina, aprovar com parcelas)
- `src/components/projects/ProjectMaterialsTab.tsx` (formulas, enviar para rastreamento)
- `src/components/projects/ProjectScheduleTab.tsx` (calendario, toggle visoes)
- `src/components/projects/ProjectFinancialTab.tsx` (prestacao de contas)
- `src/components/projects/ProjectDocumentsTab.tsx` (categorias extras)
- `src/pages/SiteTracking.tsx` (acompanhamento funcional)
- `src/pages/Suppliers.tsx` (CRUD funcional)
- `src/pages/Documents.tsx` (repositorio centralizado)
- `src/pages/Reports.tsx` (geracao de relatorios)
- `src/pages/Projects.tsx` (kanban + status novos)
- `src/lib/projectConstants.ts` (status: adicionar briefing, estudo)

## Migracao SQL

1 migracao com criacao de 4 tabelas + colunas novas em 6 tabelas existentes + dados padrao + RLS + triggers

---

## Resultado Esperado

- 8 abas do projeto totalmente funcionais com CRUD conectado ao banco
- Fluxo completo: Cenario aprovado -> Escopo preenchido -> Cotacoes por disciplina -> Parcelas de pagamento -> Prestacao de contas
- Materiais com formulas automaticas por categoria
- Cronograma com visao interna e visao cliente
- 4 paginas de Obra funcionais: Acompanhamento (multi-projeto), Fornecedores (CRUD + alocacao), Documentos (centralizado), Relatorios (4 tipos)
- Todas as conexoes entre modulos conforme especificado no documento
