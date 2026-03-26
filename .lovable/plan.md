

## Adicionar Página de Portfólio (8B) ao PDF da Proposta

### Resumo
Criar uma página condicional "NOSSOS PROJETOS" entre WhyHire e Values no PDF, com grid 2x2 de projetos selecionados. No formulário, permitir selecionar até 4 projetos da tabela `projects` com legenda opcional. Salvar como JSONB array de objetos `{ id, nome, foto_url, legenda }`.

### Edições

**1. `src/components/leads/proposal-pages/shared.tsx`**
- Adicionar `portfolioCards?: { id: string; nome: string; foto_url: string; legenda?: string }[]` ao `ProposalPageProps`

**2. Criar `src/components/leads/proposal-pages/PortfolioCardsPage.tsx`**
- Nova página com fundo `#F5E0D0`
- Titulo "NOSSOS PROJETOS" centralizado em Cormorant Garamond
- Grid 2x2 com cards: foto (objectFit cover, borderRadius 8), nome em Jost 11px uppercase, legenda em Cormorant Garamond 13px itálico
- Recebe `portfolioCards` e `pageWidth/pageHeight` do `ProposalPageProps`

**3. `src/components/leads/ProposalPageRenderer.tsx`**
- Importar `ProposalPortfolioCardsPage`
- Inserir condicionalmente entre WhyHire e Values: `if (pageData.portfolioCards?.length) pages.push(<ProposalPortfolioCardsPage .../>)`

**4. `src/components/leads/ProposalFormNew.tsx`**
- Alterar `portfolio_projects` de `string[]` para `{ id: string; nome: string; foto_url: string; legenda: string }[]` na interface
- Na seção 7, buscar projetos da tabela `projects` via query (`id, name`) com `useQuery`
- Renderizar lista de projetos com checkbox (máx 4 seleções) + campo de legenda opcional para cada selecionado
- Manter a seção de portfólio de assets existente separada (ou substituir conforme a nova lógica)

**5. `src/pages/LeadsProposals.tsx`**
- Em `buildPageProps`: mapear `portfolioCards` a partir de `formData.portfolio_projects`
- No payload de save/load: manter `portfolio_projects` como JSONB (já é jsonb no banco, compatível com objetos)

### Compatibilidade
O campo `portfolio_projects` no banco já é `jsonb` com default `'[]'`. A mudança de `string[]` para `object[]` é compatível sem migration.

### Arquivos

| Arquivo | Ação |
|---|---|
| `shared.tsx` | Nova prop `portfolioCards` |
| `PortfolioCardsPage.tsx` | Novo componente de página |
| `ProposalPageRenderer.tsx` | Inserir página condicional |
| `ProposalFormNew.tsx` | Seção de seleção de projetos com legenda |
| `LeadsProposals.tsx` | Mapear e persistir dados |

