

## Adicionar página "Projeto de Interiores" condicional

### Resumo
Criar uma nova página que aparece entre Escopo/Processo (pág 3) e Gerenciamento (pág 4), apenas quando `servicesIncluded` for "ambos" ou "projeto". A página exibe 4 colunas com ícones SVG inline e descrições das etapas de interiores.

### Edições

**1. Novo arquivo `src/components/leads/proposal-pages/InterioresPage.tsx`**
- Fundo: `COLORS.begeClaro` (#F5E0D0)
- Título centralizado: "PROJETO DE INTERIORES" — Cormorant Garamond, 36px, bold, cor azulMarinho
- Subtítulo: texto descritivo em Jost, 11px, uppercase, letter-spacing 1.5px, cor textoTituloVinho
- Grid horizontal 4 colunas, cada uma com:
  - Ícone SVG inline (outline, cor roseMauve, ~64px): Briefing (pessoas), Estudo Preliminar (planta), Anteprojeto (sofá/3D), Projeto Executivo (computador)
  - Nome da etapa em bold uppercase
  - Descrição em texto menor
- Logo Quadra no canto inferior direito

**2. `src/components/leads/ProposalPageRenderer.tsx`**
- Importar `ProposalInterioresPage`
- No `buildProposalPages`, inserir condicionalmente entre ScopeFlowPage e ManagementFullPage:
  - Se `data.servicesIncluded === "ambos"` ou `data.servicesIncluded === "projeto"`, incluir a página
  - Se `data.servicesIncluded === "gerenciamento"`, não incluir

Nenhuma outra página, rota ou seção do formulário será alterada. O campo `services_included` já existe no formulário com valores "ambos", "projeto" e "gerenciamento".

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/leads/proposal-pages/InterioresPage.tsx` | Criar — nova página com grid de 4 colunas e ícones SVG |
| `src/components/leads/ProposalPageRenderer.tsx` | Editar — inserir página condicionalmente |

