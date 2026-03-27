

## Rodapé de validade em todas as páginas do PDF

### Migration SQL
```sql
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS valid_until date DEFAULT NULL;
```

### Edições

**1. `src/components/leads/proposal-pages/shared.tsx`**
- Adicionar `validUntil?: string | null` à interface `ProposalPageProps`
- Criar componente reutilizável `ValidityFooter`:
  - Props: `validUntil?: string | null`, `dark?: boolean`
  - Se `validUntil` for null/undefined, retorna null
  - Formata data como dd/mm/aaaa
  - Estilo: `position: absolute; bottom: 14px; left: 24px; fontFamily: FONT_BODY; fontSize: 8; opacity: 0.4`
  - Cor: `#1B2A4A` para páginas claras (default), `#F0DCC8` para páginas escuras (`dark={true}`)
  - Texto: `Proposta válida até [dd/mm/aaaa]`

**2. Cada componente de página — adicionar `<ValidityFooter>`**
Dentro do `<PageContainer>`, antes do fechamento:

| Página | Fundo | dark? |
|---|---|---|
| CoverPage | azulMarinho | `true` |
| AboutPage | begeClaro | `false` |
| ScopeFlowPage | begeClaro | `false` |
| InterioresPage | begeClaro | `false` |
| ManagementFullPage | azulMarinho | `true` |
| WhyHireValuesPage | begeClaro | `false` |
| PortfolioCardsPage | begeClaro | `false` |
| ValuesPage | begeClaro | `false` |
| ContactPage | roseMauve | `true` |

Cada componente já recebe `...ProposalPageProps` via spread, então `validUntil` chega automaticamente.

**3. `src/components/leads/ProposalFormNew.tsx`**
- Adicionar `valid_until: string | null` à interface `ProposalFormData`
- Inicializar com `initialData?.valid_until ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)`
- Na seção "1. Dados do Projeto", após o campo "Tipo de projeto", adicionar date picker (Popover + Calendar do shadcn) com label "Validade da proposta"

**4. `src/pages/LeadsProposals.tsx`**
- Em `buildPageProps`: adicionar `validUntil: formData.valid_until`
- No payload de save: incluir `valid_until: formData.valid_until`
- Na carga de dados (edit): ler `valid_until: (p as any).valid_until ?? null`

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Nova coluna `valid_until` |
| `shared.tsx` | Nova prop + componente `ValidityFooter` |
| `CoverPage.tsx` | Adicionar `<ValidityFooter dark />` |
| `AboutPage.tsx` | Adicionar `<ValidityFooter />` |
| `ScopeFlowPage.tsx` | Adicionar `<ValidityFooter />` |
| `InterioresPage.tsx` | Adicionar `<ValidityFooter />` |
| `ManagementFullPage.tsx` | Adicionar `<ValidityFooter dark />` |
| `WhyHireValuesPage.tsx` | Adicionar `<ValidityFooter />` |
| `PortfolioCardsPage.tsx` | Adicionar `<ValidityFooter />` |
| `ValuesPage.tsx` | Adicionar `<ValidityFooter />` |
| `ContactPage.tsx` | Adicionar `<ValidityFooter dark />` |
| `ProposalFormNew.tsx` | Novo campo date picker na seção 1 |
| `LeadsProposals.tsx` | Mapear prop e persistir |

