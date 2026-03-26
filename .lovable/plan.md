

## Prazos dinâmicos: exibir apenas campos das etapas ativas

### Abordagem
Criar um mapeamento entre nomes de etapas e campos de prazo, então filtrar os campos exibidos na seção 5 com base em `data.etapas_ativas`. Etapas sem prazo (Anteprojeto) não geram campo.

### Edição única: `src/components/leads/ProposalFormNew.tsx`

1. Adicionar constante de mapeamento etapa → campo de prazo:
```typescript
const ETAPA_TIMELINE_MAP: { etapa: string; field: keyof ProposalFormData; label: string }[] = [
  { etapa: "Briefing", field: "timeline_briefing", label: "Briefing (dias)" },
  { etapa: "Estudo Preliminar", field: "timeline_study", label: "Estudo preliminar (dias)" },
  { etapa: "Orçamento Executivo", field: "timeline_budget", label: "Orçamento executivo (dias)" },
  { etapa: "Reunião de Prioridades", field: "timeline_priorities", label: "Reunião prioridades (dias)" },
  { etapa: "Mobilização de Obra", field: "timeline_mobilization", label: "Mobilização de obra (dias)" },
  { etapa: "Conferência e Fiscalização de Obra", field: "timeline_fiscalization", label: "Conferência e fiscalização (dias)" },
];
```
Note: "Obra (dias trabalhados)" (`timeline_construction`) aparece sempre, pois não corresponde a uma etapa específica do fluxo.

2. Substituir os campos hardcoded na seção 5 por iteração filtrada:
   - Filtrar `ETAPA_TIMELINE_MAP` por `data.etapas_ativas.includes(item.etapa)`
   - Renderizar cada campo dinamicamente
   - Manter o campo "Obra (dias trabalhados)" sempre visível (fora do map)

3. Adicionar aviso no topo da seção: `"Os campos exibidos seguem as etapas selecionadas acima."`

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/leads/ProposalFormNew.tsx` | Mapeamento etapa→prazo, renderização condicional, aviso |

