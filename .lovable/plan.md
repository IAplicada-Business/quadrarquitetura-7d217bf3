

## Adicionar prazo para Anteprojeto

### Migration SQL
```sql
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS timeline_anteprojeto integer DEFAULT NULL;
```

### Edições

**1. `src/components/leads/ProposalFormNew.tsx`**
- Adicionar `timeline_anteprojeto: number | null;` à interface `ProposalFormData`
- Adicionar entrada no `ETAPA_TIMELINE_MAP`: `{ etapa: "Anteprojeto", field: "timeline_anteprojeto", label: "Anteprojeto (dias)" }`
- Marcar como nullable na lógica de renderização (linha ~299)

**2. `src/components/leads/proposal-pages/shared.tsx`**
- Adicionar `timelineAnteprojeto?: number;` ao `ProposalPageProps`

**3. `src/components/leads/proposal-pages/ScopeFlowPage.tsx`**
- Alterar `daysKey` de `null` para `"anteprojeto"` na etapa "Anteprojeto" (linha 6)
- Adicionar `anteprojeto: timelineAnteprojeto` ao `daysMap` (linha 27-34)
- Adicionar `timelineAnteprojeto` na desestruturação de props (linha 16)

**4. `src/pages/LeadsProposals.tsx`**
- Em `buildPageProps`: `timelineAnteprojeto: formData.timeline_anteprojeto ?? undefined`
- No payload de save: `timeline_anteprojeto: formData.timeline_anteprojeto`
- Na carga de dados: `timeline_anteprojeto: (p as any).timeline_anteprojeto ?? null`

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Nova coluna `timeline_anteprojeto` |
| `ProposalFormNew.tsx` | Nova prop + entrada no mapa de etapas |
| `shared.tsx` | Nova prop `timelineAnteprojeto` |
| `ScopeFlowPage.tsx` | Mapear daysKey e prop |
| `LeadsProposals.tsx` | Persistir e carregar campo |

