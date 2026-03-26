

## Vincular prazos de Mobilização e Fiscalização ao fluxo do PDF

### Resumo
Adicionar 2 novas colunas no banco (`timeline_mobilization`, `timeline_fiscalization`), 2 campos no formulário, e mapear no `ScopeFlowPage` para que os badges de dias apareçam nessas etapas.

### Edições

**1. Migration SQL**
```sql
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS timeline_mobilization integer DEFAULT NULL;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS timeline_fiscalization integer DEFAULT NULL;
```

**2. `src/components/leads/proposal-pages/shared.tsx`**
- Adicionar `timelineMobilization?: number` e `timelineFiscalization?: number` ao `ProposalPageProps`

**3. `src/components/leads/proposal-pages/ScopeFlowPage.tsx`**
- Alterar `ALL_FLOW_STEPS`: Mobilização recebe `daysKey: "mobilization"`, Conferência recebe `daysKey: "fiscalization"`
- No `daysMap`, adicionar `mobilization: timelineMobilization` e `fiscalization: timelineFiscalization`
- Receber `timelineMobilization` e `timelineFiscalization` nas props destructured

**4. `src/components/leads/ProposalFormNew.tsx`**
- Adicionar `timeline_mobilization` e `timeline_fiscalization` à interface e ao state (default `null`)
- Na seção "5. Prazos", adicionar 2 campos: "Mobilização de obra (dias)" e "Conferência e fiscalização (dias trabalhados)"

**5. `src/pages/LeadsProposals.tsx`**
- Em `buildPageProps`: mapear `timelineMobilization` e `timelineFiscalization`
- No payload de save: incluir `timeline_mobilization` e `timeline_fiscalization`
- Na carga de dados existentes: carregar ambos campos com default `null`

### Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | 2 novas colunas |
| `shared.tsx` | 2 props novas |
| `ScopeFlowPage.tsx` | daysKey para mobilização e fiscalização |
| `ProposalFormNew.tsx` | 2 campos no formulário |
| `LeadsProposals.tsx` | Mapear e persistir |

