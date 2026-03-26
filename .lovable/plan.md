

## Adicionar campo "Orçamento Executivo (dias)" ao formulário e PDF

### Resumo
Adicionar `timeline_budget` (integer, default 7) ao formulário, interface, banco, página PDF e mapeamento de dados.

### Edições

**1. Migration — nova coluna**
```sql
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS timeline_budget integer DEFAULT 7;
```

**2. `src/components/leads/proposal-pages/shared.tsx`**
- Adicionar `timelineBudget?: number` ao `ProposalPageProps`

**3. `src/components/leads/ProposalFormNew.tsx`**
- Adicionar `timeline_budget: number` ao `ProposalFormData` (default 7)
- Adicionar campo "Orçamento executivo (dias)" na seção de Prazos, entre "Estudo preliminar" e "Reunião de prioridades"

**4. `src/components/leads/proposal-pages/ScopeFlowPage.tsx`**
- No `ALL_FLOW_STEPS`, alterar "Orçamento Executivo" de `daysKey: null` para `daysKey: "budget"`
- Adicionar `budget: timelineBudget` ao `daysMap`

**5. `src/pages/LeadsProposals.tsx`**
- Em `buildPageProps`: mapear `timelineBudget: formData.timeline_budget`
- No `handleSave`: incluir `timeline_budget` no payload de insert/update
- Na edição: carregar `timeline_budget` do registro existente

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Nova coluna `timeline_budget` |
| `shared.tsx` | Adicionar prop `timelineBudget` |
| `ProposalFormNew.tsx` | Novo campo no form + interface |
| `ScopeFlowPage.tsx` | Conectar daysKey "budget" |
| `LeadsProposals.tsx` | Mapear e persistir o campo |

