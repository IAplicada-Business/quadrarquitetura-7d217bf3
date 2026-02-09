

# Conexao Completa: Banco de Dados + Frontend para o Fluxo Lead-a-Obra

## Resumo

Implementar as tabelas que faltam no banco de dados (leads, proposals, contracts, scenarios, scenario_items) e conectar o frontend das paginas placeholder (Pipeline, Propostas, Contratos) ao banco, alem de adicionar a aba Cenarios no projeto. Inclui as automacoes de conexao entre etapas conforme o documento.

---

## Fase 1 — Banco de Dados (Migracao SQL)

### Novas tabelas a criar:

**1. `leads`**
| Coluna | Tipo | Obrigatorio | Default |
|--------|------|-------------|---------|
| id | uuid | Sim | gen_random_uuid() |
| user_id | uuid | Sim | - |
| name | text | Sim | - |
| email | text | Nao | - |
| phone | text | Sim | - |
| phone_secondary | text | Nao | - |
| project_type | client_type enum | Sim | 'residencial' |
| origin | client_origin enum | Sim | 'outro' |
| responsible | text | Nao | - |
| notes | text | Nao | - |
| status | text | Sim | 'novo' |
| meeting_date | date | Nao | - |
| converted_client_id | uuid (FK clients) | Nao | - |
| created_at / updated_at | timestamptz | Sim | now() |

Status do lead: novo, contato_feito, reuniao_agendada, proposta_enviada, fechado, perdido

**2. `proposals`**
| Coluna | Tipo | Obrigatorio | Default |
|--------|------|-------------|---------|
| id | uuid | Sim | gen_random_uuid() |
| user_id | uuid | Sim | - |
| lead_id | uuid (FK leads) | Sim | - |
| project_description | text | Nao | - |
| value | numeric | Nao | - |
| discount_percent | numeric | Nao | - |
| payment_conditions | text | Nao | - |
| deadline | text | Nao | - |
| template_name | text | Nao | - |
| status | text | Sim | 'rascunho' |
| created_at / updated_at | timestamptz | Sim | now() |

Status: rascunho, enviada, aprovada, rejeitada

**3. `contracts`**
| Coluna | Tipo | Obrigatorio | Default |
|--------|------|-------------|---------|
| id | uuid | Sim | gen_random_uuid() |
| user_id | uuid | Sim | - |
| proposal_id | uuid (FK proposals) | Sim | - |
| client_id | uuid (FK clients) | Nao | - |
| template_name | text | Nao | - |
| clauses | text | Nao | - |
| address | text | Nao | - |
| city | text | Nao | - |
| value | numeric | Nao | - |
| payment_conditions | text | Nao | - |
| start_date | date | Nao | - |
| status | text | Sim | 'rascunho' |
| project_id | uuid (FK projects) | Nao | - |
| created_at / updated_at | timestamptz | Sim | now() |

Status: rascunho, enviado, assinado, cancelado

**4. `scenarios`**
| Coluna | Tipo | Obrigatorio | Default |
|--------|------|-------------|---------|
| id | uuid | Sim | gen_random_uuid() |
| user_id | uuid | Sim | - |
| project_id | uuid (FK projects) | Sim | - |
| name | text | Sim | - |
| total_value | numeric | Nao | 0 |
| is_approved | boolean | Nao | false |
| created_at / updated_at | timestamptz | Sim | now() |

**5. `scenario_items`**
| Coluna | Tipo | Obrigatorio | Default |
|--------|------|-------------|---------|
| id | uuid | Sim | gen_random_uuid() |
| user_id | uuid | Sim | - |
| scenario_id | uuid (FK scenarios) | Sim | - |
| discipline | text | Sim | - |
| description | text | Nao | - |
| estimated_value | numeric | Nao | 0 |
| is_included | boolean | Nao | true |
| display_order | integer | Nao | - |
| created_at / updated_at | timestamptz | Sim | now() |

### Colunas novas em tabelas existentes:

**`projects`** — adicionar:
- `contract_id` uuid (FK contracts, nullable)
- `approved_scenario_id` uuid (FK scenarios, nullable)
- `client_budget` numeric (nullable) — orcamento do cliente

**`scope_items`** — adicionar:
- `estimated_value` numeric (nullable) — valor estimado vindo do cenario

### RLS para todas as novas tabelas:
- INSERT: auth.uid() = user_id
- SELECT: auth.uid() = user_id
- UPDATE: auth.uid() = user_id
- DELETE: auth.uid() = user_id

### Triggers:
- `update_updated_at_column` em todas as novas tabelas

---

## Fase 2 — Frontend: Leads Pipeline (Kanban)

Substituir o placeholder `LeadsPipeline.tsx` por uma pagina funcional com:

- Visao kanban com 6 colunas: Novo Lead, Contato Feito, Reuniao Agendada, Proposta Enviada, Fechado, Perdido
- Cards de lead com nome, telefone, tipo de projeto, origem
- Dialog para criar/editar lead com os campos do documento
- Arrastar cards entre colunas (ou botoes de avancar status)
- Ao mover para "Fechado": criar Cliente automaticamente e preencher `converted_client_id`
- Ao mover para "Proposta Enviada": mostrar botao "Gerar Proposta" que navega para `/leads/proposals`

### Hook: `src/hooks/useLeads.ts`
- CRUD completo com React Query
- Funcao `convertToClient` que cria registro em `clients` e atualiza o lead

---

## Fase 3 — Frontend: Propostas

Substituir o placeholder `LeadsProposals.tsx` por pagina funcional:

- Lista de propostas com filtro por status
- Dialog para criar proposta vinculada a um lead (dados do lead preenchidos automaticamente)
- Campos: descricao dos servicos, valor, desconto, condicoes de pagamento, prazo, template
- Botao "Aprovar" que muda status para "aprovada" e habilita "Gerar Contrato"
- Botao "Gerar Contrato" navega para `/leads/contracts` com dados pre-preenchidos

### Hook: `src/hooks/useProposals.ts`
- CRUD completo
- Query que faz join com leads para puxar dados do lead

---

## Fase 4 — Frontend: Contratos

Substituir o placeholder `LeadsContracts.tsx` por pagina funcional:

- Lista de contratos com filtro por status
- Dialog para criar contrato vinculado a proposta (dados pre-preenchidos)
- Campos: template, clausulas, endereco, cidade, data inicio, valor, condicoes
- Botao "Assinar" que:
  1. Muda status para "assinado"
  2. Cria um **Projeto** automaticamente com dados do contrato/proposta/lead
  3. Marca o lead como "Fechado" se ainda nao estava

### Hook: `src/hooks/useContracts.ts`
- CRUD completo
- Funcao `signAndCreateProject` que cria projeto e atualiza referencias

---

## Fase 5 — Frontend: Cenarios (Nova aba no Projeto)

Adicionar aba "Cenarios" no `ProjectDetail.tsx` (entre Resumo e Escopo):

- Campo "Orcamento do cliente" no topo
- Lista de cenarios (A, B, C...) com cards
- Dentro de cada cenario: lista de disciplinas com checkbox "incluido" e valor estimado
- Total por cenario com comparacao visual vs orcamento do cliente
- Botao "Aprovar Cenario" que:
  1. Marca `is_approved = true`
  2. Copia `scenario_items` com `is_included = true` para `scope_items`
  3. Atualiza `projects.approved_scenario_id` e `projects.client_budget`

### Componente: `src/components/projects/ProjectScenariosTab.tsx`
### Hook: `src/hooks/useScenarios.ts`

---

## Fase 6 — Ajustes de Conexao

### Escopo (existente):
- Se projeto tem cenario aprovado, escopo mostra duas secoes:
  - "Escopo Contratado" (itens do cenario aprovado)
  - "Escopo Idealizado" (todos os itens, inclusive os nao incluidos)
- Exibir `estimated_value` nos itens

### ProjectSummaryTab:
- Mostrar "Orcamento Idealizado" vs "Orcamento Contratado" se cenario existir
- Mostrar link para o contrato de origem se `contract_id` existir

---

## Arquivos a criar:
- `src/hooks/useLeads.ts`
- `src/hooks/useProposals.ts`
- `src/hooks/useContracts.ts`
- `src/hooks/useScenarios.ts`
- `src/components/projects/ProjectScenariosTab.tsx`

## Arquivos a modificar:
- `src/pages/LeadsPipeline.tsx` (substituir placeholder por kanban)
- `src/pages/LeadsProposals.tsx` (substituir placeholder por lista funcional)
- `src/pages/LeadsContracts.tsx` (substituir placeholder por lista funcional)
- `src/pages/ProjectDetail.tsx` (adicionar aba Cenarios)
- `src/components/projects/ProjectSummaryTab.tsx` (exibir dados do cenario/contrato)
- `src/components/projects/ProjectScopeTab.tsx` (duas secoes: contratado vs idealizado)

## Migracao SQL:
- 1 migracao com criacao das 5 tabelas + colunas novas + RLS + triggers

---

## Resultado Esperado

- Fluxo completo funcional: Lead -> Proposta -> Contrato -> Projeto (automatico) -> Cenarios -> Escopo (auto-preenchido)
- Todas as 3 paginas de Leads funcionais com CRUD conectado ao banco
- Aba Cenarios no projeto para simulacao com cliente
- Automacoes: lead cria cliente, contrato cria projeto, cenario preenche escopo
- Dados persistidos no banco com RLS adequado

