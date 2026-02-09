

# Ajuste do Acompanhamento de Obra: Fluxo de Preenchimento e Automacao

## Diagnostico: Estado Atual vs. Solicitado

Apos analisar todo o codigo, identifiquei as seguintes lacunas entre o fluxo existente e o fluxo desejado:

### O que ja funciona
- Cenarios com disciplinas padrao, toggle inclusao/exclusao, comparacao com orcamento do cliente
- Aprovacao de cenario copia itens para `scope_items` com `scope_type="projeto"`
- Escopo com filtro Projeto vs. Contratado
- Orcamentos agrupados por disciplina do escopo contratado, com revisoes e aprovacao de cotacoes
- Materiais com importacao do orcamento, rastreamento e compras
- Cronograma com Gantt, lista, visao cliente e pendencias
- Financeiro com pagamentos e notas fiscais

### Lacunas identificadas (o que precisa ser ajustado)

1. **Cenarios -> Escopo**: Aprovacao insere itens com `scope_type="projeto"` mas deveria inserir como `"contratado"` (o cenario aprovado = o que foi contratado). Itens nao incluidos no cenario deveriam ir como `scope_type="projeto"` (idealizado).
2. **Cenarios**: Faltam campos de contexto (nivel de acabamento, area, tipo de obra). Falta visao comparativa lado a lado.
3. **Escopo**: Falta campo de status por item (planejado, em cotacao, contratado, em execucao, concluido). Falta campo `activities` no form.
4. **Orcamento -> Cronograma**: Nao ha automacao. As disciplinas do escopo contratado deveriam gerar etapas basicas no cronograma ao serem preenchidas.
5. **Orcamento -> Financeiro**: A aprovacao de cotacoes nao gera parcelas de pagamento automaticamente (ja ha um TODO no codigo).
6. **Acompanhamento**: A aba esta vazia (placeholder) — precisa se tornar o diario de obra funcional.
7. **Resumo**: Falta mostrar comparativo "idealizado vs contratado" com dados reais vindos dos cenarios.

---

## Plano de Implementacao

### Parte 1: Corrigir Cenarios -> Escopo (Automacao Principal)

**Arquivo:** `src/hooks/useScenarios.ts`

Ajustar a mutation `approveScenario`:
- Itens **incluidos** no cenario aprovado serao inseridos com `scope_type = "contratado"`
- **Todos** os itens (incluidos + excluidos) serao inseridos com `scope_type = "projeto"` (escopo idealizado completo)
- Antes de inserir, limpar scope_items existentes gerados por cenario anterior (para evitar duplicatas em re-aprovacoes)
- Atualizar `ideal_budget` no projeto com soma total de todos itens do cenario e `estimated_budget` com soma dos itens incluidos

**Arquivo:** `src/components/projects/ProjectScenariosTab.tsx`

Adicionar campos de contexto do projeto:
- Nivel de acabamento (select: basico, intermediario, alto padrao) — salva em `projects.finish_level` reinterpretado (ou novo campo)
- Area total (exibe `projects.area_sqm` ja existente)
- Tipo de obra (exibe `projects.project_type` ja existente)
- Visao comparativa lado a lado quando ha 2+ cenarios (grid horizontal com scroll)

### Parte 2: Status no Escopo

**Migracao SQL:** Adicionar coluna `status` na tabela `scope_items`:
```sql
ALTER TABLE scope_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planejado';
```

**Arquivo:** `src/hooks/useScopeItems.ts` — Adicionar `status` na interface e operacoes

**Arquivo:** `src/components/projects/ProjectScopeTab.tsx` — Exibir badge de status e permitir alteracao inline

**Arquivo:** `src/components/projects/ScopeItemForm.tsx` — Adicionar campo de atividades (`activities` - textarea) e status (select)

### Parte 3: Orcamento -> Financeiro (Geracao automatica de parcelas)

**Arquivo:** `src/components/projects/ProjectBudgetsTab.tsx`

Ao aprovar uma cotacao (`handleApprove`):
- Verificar `payment_terms` da cotacao (ex: "50%/50%")
- Gerar automaticamente entradas em `project_payments` com as parcelas correspondentes
- Vincular ao `scope_item_id` para rastreabilidade

**Arquivo:** `src/hooks/useBudgetQuotes.ts` — Nao precisa mudar, a logica fica no componente

### Parte 4: Escopo -> Cronograma (Pre-populacao)

**Arquivo:** `src/hooks/useScheduleTasks.ts`

Adicionar mutation `importFromScope`:
- Busca `scope_items` com `scope_type = "contratado"` e sem parent
- Cria uma `schedule_task` por disciplina com `task_name = discipline`, `discipline` preenchido, `is_client_visible = true`
- Verifica duplicatas (se ja existe task com mesmo `scope_item_id`)

**Arquivo:** `src/components/projects/ProjectScheduleTab.tsx` — Adicionar botao "Importar do Escopo"

### Parte 5: Aba Acompanhamento (Diario de Obra)

**Migracao SQL:** Criar tabela `site_diary_entries`:
```sql
CREATE TABLE public.site_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weather TEXT,
  workers_count INTEGER,
  summary TEXT,
  observations TEXT,
  photos TEXT[],
  disciplines_active TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE site_diary_entries ENABLE ROW LEVEL SECURITY;
-- RLS: usuario ve apenas seus registros
```

**Arquivo:** `src/components/projects/ProjectTrackingTab.tsx` — Reescrever completamente:
- Lista de entradas do diario por data (mais recente primeiro)
- Formulario de nova entrada: data, clima, qtd trabalhadores, resumo das atividades, observacoes, disciplinas ativas (multi-select), fotos (upload ao storage)
- Card por entrada com visual limpo
- Filtro por data (hoje, esta semana, este mes)
- Cards de metricas: total de registros, ultimo registro, media de trabalhadores

### Parte 6: Resumo com dados reais

**Arquivo:** `src/components/projects/ProjectSummaryTab.tsx`

Ajustar para puxar dados reais:
- `ideal_budget` do projeto (soma total do cenario)
- `estimated_budget` como orcamento contratado (soma dos itens incluidos)
- `real_budget` como soma dos pagamentos realizados (status = "pago")
- Progresso baseado nas tasks `executado` / total

---

## Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| Migracao SQL | Adicionar `status` em `scope_items` + criar tabela `site_diary_entries` |
| `src/hooks/useScenarios.ts` | Corrigir: itens incluidos -> `contratado`, todos -> `projeto`. Atualizar budgets |
| `src/components/projects/ProjectScenariosTab.tsx` | Adicionar contexto (acabamento, area) e visao comparativa |
| `src/hooks/useScopeItems.ts` | Adicionar `status` na interface |
| `src/components/projects/ProjectScopeTab.tsx` | Badge de status + alteracao inline |
| `src/components/projects/ScopeItemForm.tsx` | Campos `activities` e `status` |
| `src/components/projects/ProjectBudgetsTab.tsx` | Gerar parcelas ao aprovar cotacao |
| `src/hooks/useScheduleTasks.ts` | Mutation `importFromScope` |
| `src/components/projects/ProjectScheduleTab.tsx` | Botao "Importar do Escopo" |
| `src/components/projects/ProjectTrackingTab.tsx` | Reescrever - diario de obra funcional |
| `src/components/projects/ProjectSummaryTab.tsx` | Dados reais de orcamento/progresso |

---

## Detalhes Tecnicos

### Logica de aprovacao do cenario (corrigida)

```text
1. Limpar scope_items anteriores com source = cenario (evitar duplicatas)
2. Inserir TODOS os itens com scope_type = "projeto"
3. Inserir itens INCLUIDOS tambem com scope_type = "contratado"
4. Atualizar projects.ideal_budget = soma de todos
5. Atualizar projects.estimated_budget = soma dos incluidos
6. Atualizar projects.approved_scenario_id
```

### Parsing de payment_terms para parcelas

```text
Entrada: "50%/50%" ou "30/30/40" ou "a vista"
Logica:
- Split por "/" ou "%" -> extrair percentuais
- Se "a vista" -> 1 parcela de 100%
- Para cada percentual: criar payment com value = total * (pct/100)
- due_date: primeira parcela = hoje, demais = +30 dias cada
```

### Diario de obra - upload de fotos

```text
- Usa o bucket `project-files` ja existente
- Path: {userId}/{projectId}/diary/{date}_{filename}
- Salva URLs no array `photos` da entrada
- Exibe em grid 2x2 com lightbox ao clicar
```

