

## Controle de etapas visíveis na proposta

### Resumo
Adicionar campo `etapas_ativas` (array de strings) na tabela `proposals` e no formulário, com checkboxes para 7 etapas. Na Página 3 do PDF, renderizar apenas as etapas marcadas com grid dinâmico.

### Edições

**1. Migration — nova coluna**
```sql
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS etapas_ativas jsonb DEFAULT '["Briefing","Estudo Preliminar","Anteprojeto","Orçamento Executivo","Reunião de Prioridades","Mobilização de Obra","Conferência e Fiscalização de Obra"]'::jsonb;
```

**2. `ProposalFormData` — `src/components/leads/ProposalFormNew.tsx`**
- Adicionar `etapas_ativas: string[]` ao interface
- Default: todas as 7 etapas
- Nova seção "5. Etapas do Projeto" (entre Prazos e Valores, renumerando 5→6 e 6→7)
- 7 checkboxes com label de cada etapa + botão "Selecionar todas"

**3. `shared.tsx`**
- Adicionar `etapasAtivas?: string[]` ao `ProposalPageProps`

**4. `ScopeFlowPage.tsx`**
- Substituir `FLOW_STEPS` fixo por mapeamento das 7 etapas possíveis (cada uma com título, descrição e campo de dias)
- Filtrar apenas as que estão em `etapasAtivas`
- Grid dinâmico: `gridTemplateColumns: repeat(N, 1fr)` onde N = número de etapas ativas
- Renumerar círculos sequencialmente (1, 2, 3...)
- Ajustar tamanho dos círculos e fontes quando N > 5 (compactar proporcionalmente)

**5. `LeadsProposals.tsx`**
- Passar `etapas_ativas` no payload de save
- Passar `etapasAtivas` no `buildPageProps`
- Carregar do banco ao editar

