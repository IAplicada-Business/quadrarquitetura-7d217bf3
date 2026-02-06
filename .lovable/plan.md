
# Reestruturacao do Fluxo de Projeto e Simplificacao de Status

## Resumo

Esta mudanca reestrutura o fluxo do projeto de forma fundamental: simplifica os 14 status atuais para 7 fases macro, reorganiza as abas do projeto para refletir o novo fluxo (Lead -> Proposta -> Contrato -> Cenarios -> Escopo -> Orcamento -> Cronograma -> Financeiro/Prestacao de Contas), e consolida Compras dentro de Orcamentos e Pendencias dentro de Cronograma.

---

## Impacto Mapeado

Atualmente o enum `project_status` no banco possui 14 valores. Ele e referenciado em:
- `src/pages/Projects.tsx` (listagem + filtros)
- `src/pages/ProjectDetail.tsx` (badge de status)
- `src/components/projects/ProjectForm.tsx` (dropdown de status)
- `src/components/projects/ProjectSummaryTab.tsx` (exibicao)
- `src/pages/Dashboard.tsx` (mock)
- `src/pages/DashboardEscritorio.tsx` (mock)

As abas do projeto atualmente sao 10: Resumo, Escopo, Orcamentos, Materiais, Compras, Cronograma, Pendencias, Financeiro, Documentos, Acompanhamento.

---

## O Que Sera Feito

### 1. Migrar o Enum de Status no Banco de Dados

Substituir os 14 valores do enum `project_status` pelos 7 novos:

```text
ANTIGOS                        -> NOVOS
proposta_enviada               -> proposta
contrato_assinado              -> contrato
levantamento                   -> projeto
briefing                       -> projeto
estudo_preliminar              -> projeto
revisao                        -> projeto
anteprojeto_3d                 -> projeto
projeto_executivo              -> projeto
memoria_calculo                -> planejamento
orcamento                      -> planejamento
reuniao_prioridades            -> planejamento
mobilizacao_fornecedores       -> mobilizacao
execucao_obra                  -> execucao
concluido                      -> concluido
```

A migracao:
1. Adiciona os novos valores ao enum
2. Atualiza os registros existentes para os novos valores
3. Remove os valores antigos do enum

### 2. Adicionar Coluna de Sub-fase (Uso Interno)

Para manter a granularidade desejada internamente, adicionar uma coluna `sub_status` (TEXT, nullable) na tabela `projects` onde sub-fases podem ser salvas opcionalmente (ex: "Levantamento", "Briefing", "Estudo Preliminar" dentro da fase "Projeto").

### 3. Reorganizar Abas do Projeto

As 10 abas atuais serao reorganizadas para 8 abas no novo fluxo:

```text
ABAS ATUAIS          -> NOVO LAYOUT
Resumo               -> Resumo (mantida)
Escopo               -> Escopo (mantida)
Orcamentos           -> Orcamentos (absorve Compras)
Materiais            -> Materiais (mantida)
Compras              -> REMOVIDA (embutida em Orcamentos)
Cronograma           -> Cronograma (absorve Pendencias)
Pendencias           -> REMOVIDA (embutida em Cronograma)
Financeiro           -> Prestacao de Contas (renomeada)
Documentos           -> Documentos (mantida)
Acompanhamento       -> Acompanhamento (mantida como placeholder)
```

### 4. Embutir Compras no Orcamentos

A aba de Orcamentos ganhara uma sub-aba ou secao inferior com a lista de compras. O componente `ProjectPurchasesTab` sera reutilizado como secao interna dentro de `ProjectBudgetsTab`, acessivel via sub-tabs ("Cotacoes" | "Compras").

### 5. Embutir Pendencias no Cronograma

A aba de Cronograma ganhara uma sub-aba de pendencias. O componente `ProjectPendingTab` sera reutilizado como secao interna dentro de `ProjectScheduleTab`, acessivel via sub-tabs ("Cronograma" | "Pendencias").

### 6. Renomear Financeiro para Prestacao de Contas

O tab trigger muda de "Financeiro" para "Prestacao de Contas" e a sub-aba interna "Notas Fiscais" fica como foco principal (extrato da obra para o cliente). A sub-aba de Pagamentos permanece.

### 7. Atualizar statusLabels em Todos os Arquivos

Os 6 arquivos que declaram `statusLabels` serao atualizados para o novo mapa:

```text
proposta     -> "Proposta"
contrato     -> "Contrato"
projeto      -> "Projeto"
planejamento -> "Planejamento"
mobilizacao  -> "Mobilizacao"
execucao     -> "Execucao"
concluido    -> "Concluido"
```

### 8. Atualizar statusColors em Projects.tsx

Novos mapeamentos de cores para as 7 fases.

### 9. Atualizar ProjectForm

O dropdown de status passara a mostrar os 7 novos valores. Um segundo dropdown opcional "Sub-fase" aparecera quando o status for "projeto" ou "planejamento", com as sub-fases correspondentes.

---

## Detalhes Tecnicos

### Migracao SQL

```sql
-- Adicionar novos valores ao enum
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'proposta';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'contrato';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'projeto';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'planejamento';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'mobilizacao';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'execucao';

-- Adicionar coluna sub_status
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sub_status TEXT;

-- Migrar dados existentes
UPDATE projects SET sub_status = 'levantamento', status = 'projeto' WHERE status = 'levantamento';
UPDATE projects SET sub_status = 'briefing', status = 'projeto' WHERE status = 'briefing';
UPDATE projects SET sub_status = 'estudo_preliminar', status = 'projeto' WHERE status = 'projeto';
-- (continua para cada mapeamento...)
UPDATE projects SET status = 'proposta' WHERE status = 'proposta_enviada';
UPDATE projects SET status = 'contrato' WHERE status = 'contrato_assinado';
UPDATE projects SET status = 'planejamento' WHERE status = 'memoria_calculo';
UPDATE projects SET status = 'planejamento' WHERE status = 'orcamento';
UPDATE projects SET status = 'planejamento' WHERE status = 'reuniao_prioridades';
UPDATE projects SET status = 'mobilizacao' WHERE status = 'mobilizacao_fornecedores';
UPDATE projects SET status = 'execucao' WHERE status = 'execucao_obra';

-- Recriar enum sem valores antigos (via rename + create + swap)
```

Nota: A recriacao do enum sera feita via a tecnica de criar novo tipo, alterar coluna, e dropar o antigo, ja que PostgreSQL nao permite remover valores de enum diretamente.

### Arquivos a Modificar

**Banco de Dados:**
- Migracao para alterar enum + adicionar `sub_status`

**Frontend - Status (6 arquivos):**
- `src/pages/Projects.tsx`
- `src/pages/ProjectDetail.tsx`
- `src/components/projects/ProjectForm.tsx`
- `src/components/projects/ProjectSummaryTab.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/DashboardEscritorio.tsx`

**Frontend - Abas (2 arquivos):**
- `src/pages/ProjectDetail.tsx` (remover abas Compras e Pendencias, renomear Financeiro)
- `src/components/projects/ProjectBudgetsTab.tsx` (adicionar sub-tab de Compras)
- `src/components/projects/ProjectScheduleTab.tsx` (adicionar sub-tab de Pendencias)
- `src/components/projects/ProjectFinancialTab.tsx` (renomear para Prestacao de Contas)

### Estrutura das Sub-fases

As sub-fases ficam como texto livre na coluna `sub_status`, com opcoes sugeridas no frontend:

```text
Fase "projeto": Levantamento, Briefing, Estudo Preliminar, Revisao, Anteprojeto (3D), Projeto Executivo
Fase "planejamento": Memoria de Calculo, Orcamento, Reuniao de Prioridades
```

### Dados Mock nos Dashboards

Os status mockados em `DashboardEscritorio.tsx` e `DashboardObras.tsx` serao atualizados para usar os novos valores (proposta, contrato, projeto, planejamento, mobilizacao, execucao, concluido).

---

## Riscos e Mitigacao

- **Dados existentes**: A migracao converte automaticamente os status antigos para os novos, preservando a informacao granular na coluna `sub_status`
- **Enum imutavel**: PostgreSQL nao permite remover valores de enum, entao a migracao recria o tipo via tecnica de swap (criar novo tipo, converter coluna, dropar antigo)
- **Compras/Pendencias**: Os componentes existentes sao reutilizados como sub-componentes, sem perda de funcionalidade

---

## Resultado Esperado

- 7 status simplificados no lugar de 14
- Sub-fases opcionais para controle interno granular
- 8 abas no projeto (vs 10 atuais), com fluxo mais logico
- Compras embutida em Orcamentos como sub-tab
- Pendencias embutida em Cronograma como sub-tab
- Financeiro renomeado para Prestacao de Contas
- Todos os filtros, badges, formularios e dashboards atualizados
