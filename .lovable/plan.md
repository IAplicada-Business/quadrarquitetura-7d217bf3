
# Adequacao Completa: Leads, Propostas e Contratos conforme Documento v2

## Resumo

O sistema atual tem uma implementacao basica dos modulos de Leads, Propostas e Contratos, mas esta muito simplificada em relacao ao documento de especificacao. As principais lacunas sao:

1. **Banco de dados**: Faltam tabelas inteiras (`proposal_templates`, `contract_templates`, `lead_form_submissions`) e muitas colunas nas tabelas existentes
2. **Propostas**: Falta geracao automatica via IA, preview em tempo real, templates, campos detalhados, exportacao PDF
3. **Contratos**: Falta templates com placeholders, preview em tempo real, campos detalhados
4. **Leads**: Faltam campos (construction_type, message, source_detail, lost_reason, converted_at) e funcionalidades (KPI cards, filtros, formulario publico)

---

## Fase 1 — Migracao de Banco de Dados

### 1.1 Novas tabelas a criar:

**`proposal_templates`** — Templates reutilizaveis para propostas
- id, user_id, name, template_type, introduction, methodology, differentials, terms, footer, is_active, display_order, created_at, updated_at
- Inserir 1 registro padrao "Modelo Padrao Residencial" com textos do documento

**`contract_templates`** — Templates reutilizaveis para contratos
- id, user_id, name, contract_type, clause_object, clause_scope, clause_value, clause_duration, clause_obligations_contractor, clause_obligations_client, clause_termination, clause_confidentiality, clause_general, is_active, display_order, created_at, updated_at
- Inserir 1 registro padrao "Contrato Projeto + Acompanhamento de Obra"

**`lead_form_submissions`** — Formulario publico (sem auth para INSERT)
- id, name, email, phone, project_type, message, processed, generated_lead_id, created_at
- RLS: anon pode INSERT; autenticados podem SELECT/UPDATE

### 1.2 Colunas novas na tabela `leads`:
- `construction_type` text (nullable)
- `message` text (nullable)
- `source_detail` text (nullable)
- `lost_reason` text (nullable)
- `converted_at` timestamptz (nullable)

Nota: o campo `origin` existente sera mantido como equivalente ao `source` do documento.

### 1.3 Colunas novas na tabela `proposals`:
- `client_id` uuid (nullable, FK clients)
- `template_id` uuid (nullable, FK proposal_templates)
- `proposal_number` text (nullable) — gerado automaticamente PROP-{ANO}-{SEQ}
- `title` text (nullable)
- `project_type` text (nullable)
- `estimated_area` numeric (nullable)
- `estimated_duration` text (nullable)
- `includes_architectural_project` boolean (default true)
- `includes_construction_management` boolean (default true)
- `includes_interior_design` boolean (default false)
- `includes_3d_visualization` boolean (default false)
- `custom_services` text (nullable)
- `discount_value` numeric (nullable)
- `final_value` numeric (nullable)
- `payment_method` text (nullable)
- `sent_at` timestamptz (nullable)
- `approved_at` timestamptz (nullable)
- `rejected_at` timestamptz (nullable)
- `rejection_reason` text (nullable)
- `created_by` text (nullable)
- `notes` text (nullable)

### 1.4 Colunas novas na tabela `contracts`:
- `template_id` uuid (nullable, FK contract_templates)
- `contract_number` text (nullable) — CONTR-{ANO}-{SEQ}
- `title` text (nullable)
- `client_name` text (nullable)
- `client_cpf_cnpj` text (nullable)
- `client_email` text (nullable)
- `client_phone` text (nullable)
- `client_address` text (nullable)
- `construction_neighborhood` text (nullable)
- `service_description` text (nullable)
- `payment_method` text (nullable)
- `estimated_duration` text (nullable)
- `custom_clauses` text (nullable)
- `sent_at` timestamptz (nullable)
- `signed_at` timestamptz (nullable)
- `cancelled_at` timestamptz (nullable)
- `cancellation_reason` text (nullable)
- `created_by` text (nullable)
- `notes` text (nullable)

### 1.5 RLS em todas as novas tabelas:
- Padrao user_id = auth.uid() para CRUD
- Excecao: `lead_form_submissions` permite INSERT anonimo

---

## Fase 2 — Edge Function para Geracao de Proposta com IA

Criar edge function `generate-proposal` que usa Lovable AI (google/gemini-3-flash-preview) para gerar automaticamente o texto da proposta comercial.

**Input**: dados do lead (nome, tipo de projeto, tipo de obra), template selecionado, servicos inclusos, area estimada, valor
**Output**: texto formatado da descricao dos servicos (project_description) personalizado para o cliente

A IA recebera o template (introduction, methodology, differentials) como contexto e gerara a descricao do projeto adaptada ao tipo de obra e cliente.

Fluxo:
1. Usuario seleciona lead + template + preenche servicos e valor
2. Clica em "Gerar com IA"
3. Edge function chama Lovable AI com prompt estruturado
4. Texto gerado e inserido no campo `project_description`
5. Usuario pode editar antes de salvar

---

## Fase 3 — Frontend: Propostas Completas

Reescrever `LeadsProposals.tsx` com:

### 3.1 Lista de Propostas (rota /leads/proposals)
- Tabela com colunas: Numero, Titulo, Cliente, Valor, Status (badge), Data, Acoes
- Filtros por status (todos/rascunho/enviada/em_negociacao/aprovada/rejeitada)
- Acoes: Editar, Gerar PDF, Duplicar, Marcar como Enviada, Aprovar (sugere contrato), Rejeitar (campo motivo)

### 3.2 Tela de Criacao/Edicao (rota /leads/proposals/new e /leads/proposals/:id/edit)
Layout em duas colunas:

**Coluna esquerda — Formulario**:
- Secao 1: Lead vinculado (dropdown, auto-preenche dados)
- Secao 2: Template (dropdown de proposal_templates)
- Secao 3: Detalhes (titulo, descricao com botao "Gerar com IA", area, prazo)
- Secao 4: Servicos inclusos (4 toggles + campo extras)
- Secao 5: Valores (valor, desconto %, valor final calculado, condicoes, forma pagamento)
- Secao 6: Observacoes internas

**Coluna direita — Preview em tempo real**:
- Simula folha A4 com conteudo atualizado em tempo real
- Estrutura: Logo, numero, saudacao, introducao do template, servicos, metodologia, diferenciais, investimento, termos, rodape

### 3.3 Geracao de PDF
- Usar a biblioteca nativa do browser (window.print com CSS @media print) ou gerar via canvas/html2pdf
- Baseado no preview da coluna direita

### 3.4 Numeracao automatica
- Ao criar, gerar PROP-{ANO}-{SEQ 3 digitos} consultando o ultimo numero do ano

---

## Fase 4 — Frontend: Contratos Completos

Reescrever `LeadsContracts.tsx` com:

### 4.1 Lista de Contratos
- Mesma estrutura da lista de propostas
- Acoes: Editar, Gerar PDF, Enviar, Assinar (cria projeto), Cancelar (campo motivo)

### 4.2 Tela de Criacao/Edicao (rota /leads/contracts/new e /leads/contracts/:id/edit)
Layout duas colunas:

**Coluna esquerda**:
- Proposta vinculada (dropdown, auto-preenche)
- Dados do contratante (nome, CPF/CNPJ, email, telefone, endereco)
- Dados da obra (endereco, bairro, cidade)
- Template de contrato (dropdown)
- Servicos e valores (auto da proposta)
- Clausulas especificas (textarea)
- Observacoes internas

**Coluna direita — Preview do contrato**:
- Substituicao automatica de placeholders: {VALOR}, {CONDICOES_PAGAMENTO}, {PRAZO}, {DATA_INICIO}, {NOME_CLIENTE}, etc.
- Estrutura completa de clausulas do template

### 4.3 Geracao de PDF do contrato

---

## Fase 5 — Frontend: Leads Pipeline (melhorias)

Atualizar `LeadsPipeline.tsx`:
- Adicionar campos `construction_type`, `source_detail`, `lost_reason` no modal
- KPI cards no topo: Total leads, Novos este mes, Taxa conversao, Tempo medio
- Modal de "Motivo da perda" ao mover para "Perdido"
- Ao mover para "Fechado": registrar `converted_at`

---

## Fase 6 — Gestao de Templates

Criar componentes de CRUD para:
- Templates de proposta: acessivel via link "Gerenciar Templates" na tela de propostas
- Templates de contrato: idem na tela de contratos
- Cada template editavel com todos os campos de texto (introducao, metodologia, clausulas, etc.)
- Informar sobre placeholders disponiveis

---

## Fase 7 — Rotas Novas

Adicionar no App.tsx:
- `/leads/proposals/new` — Nova proposta
- `/leads/proposals/:id/edit` — Editar proposta
- `/leads/contracts/new` — Novo contrato
- `/leads/contracts/:id/edit` — Editar contrato

---

## Hooks a criar/atualizar:
- `src/hooks/useProposalTemplates.ts` (novo)
- `src/hooks/useContractTemplates.ts` (novo)
- `src/hooks/useProposals.ts` (atualizar com novos campos)
- `src/hooks/useContracts.ts` (atualizar com novos campos)
- `src/hooks/useLeads.ts` (atualizar com novos campos)

## Componentes a criar:
- `src/components/leads/ProposalForm.tsx` — Formulario + preview de proposta
- `src/components/leads/ProposalPreview.tsx` — Preview em tempo real
- `src/components/leads/ContractForm.tsx` — Formulario + preview de contrato
- `src/components/leads/ContractPreview.tsx` — Preview em tempo real
- `src/components/leads/TemplateManager.tsx` — CRUD de templates

## Edge functions a criar:
- `supabase/functions/generate-proposal/index.ts` — Geracao de texto via Lovable AI

## Arquivos a modificar:
- `src/pages/LeadsPipeline.tsx` (campos extras, KPIs, modal perda)
- `src/pages/LeadsProposals.tsx` (reescrever para lista + link para form)
- `src/pages/LeadsContracts.tsx` (reescrever para lista + link para form)
- `src/App.tsx` (novas rotas)

---

## Resultado Esperado

- Propostas geradas automaticamente por IA a partir dos dados do lead e template
- Preview em tempo real de propostas e contratos (simulando folha A4)
- Exportacao em PDF de propostas e contratos
- Templates editaveis de proposta e contrato com placeholders
- Numeracao automatica (PROP-2026-001, CONTR-2026-001)
- Campos completos conforme documento de especificacao
- Automacoes mantidas: lead->cliente, proposta aprovada->sugere contrato, contrato assinado->cria projeto
