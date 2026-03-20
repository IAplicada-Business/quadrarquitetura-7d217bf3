

## Redesign da Proposta — 6 Páginas Compactas

O sistema atual gera ~15+ páginas (capa, about, scope, flow, management overview, 6 pilares individuais, why hire, portfolio, feedback, values, contact). O novo design consolida tudo em 6 páginas, conforme o HTML anexado.

### Mudanças principais

**Nenhuma rota, aba ou sub-aba será removida ou alterada.**

---

### 1. Atualizar `shared.tsx` — Dimensões e tipografia

- Mudar `PAGE_W` de 794 para 595 e `PAGE_H` de 1123 para 842 (dimensões exatas do HTML fornecido, 595×842px)
- Adicionar fontes Cormorant Garamond e Jost como fontFamily no `PageContainer`
- Adicionar tag `<link>` ao Google Fonts no `index.html` para garantir que as fontes estejam disponíveis durante a captura com html2canvas

### 2. Redesign das 6 páginas de componentes

**Página 1 — Capa (`CoverPage.tsx`)**
- Foto das sócias como background com overlay gradiente (não opaco uniforme)
- "PROPOSTA" em Cormorant Garamond 54px, com divider decorativo
- Nome do cliente e "Projeto" abaixo
- Logo "QUADRA" em texto (Jost) no canto inferior direito

**Página 2 — Quem Somos (`AboutPage.tsx`)**
- Layout duas colunas: foto à esquerda (50% width, object-fit cover, height 100%), texto à direita
- Fundo bege `#F5E0D0`
- Tag "Sobre nós", título "Quem Somos", parágrafo institucional
- Bios de Camilla e Mariana com divider

**Página 3 — Escopo + Processo (unificar `ScopePage.tsx` + `FlowPage.tsx` em uma única página)**
- Criar novo componente `ScopeFlowPage.tsx`
- Seção superior: "Nosso Escopo" com parágrafo centralizado (bold em palavras-chave)
- Divider horizontal
- Seção inferior: "Nosso Processo" com 5 círculos numerados (alternando rose/azul) conectados por linhas, com badges de dias
- Fundo bege

**Página 4 — Gerenciamento (consolidar `ManagementPage.tsx` + todos os 6 `PillarPage.tsx` em uma única página)**
- Criar novo componente `ManagementFullPage.tsx`
- Fundo azul `#1B2A4A`, texto `#F0DCC8`
- Tag "Metodologia", título "Gerenciamento de Obra" em Cormorant Garamond 34px
- Grid 3×2 de cards com: título em `#C4756E`, lista de bullets resumidos (5 itens por card)
- Cada card com borda sutil e fundo semi-transparente

**Página 5 — Por que Contratar + Valores (consolidar `WhyHirePage.tsx` + `ValuesPage.tsx`)**
- Criar novo componente `WhyHireValuesPage.tsx`
- Fundo azul `#1B2A4A`
- Seção superior: título, grid 2×2 de cards numerados (01-04) com descrições
- Seção inferior (separada por border-top): "VALORES" com dois boxes (Investimento Total + Formas de Pagamento)
- Nota de rodapé em itálico
- Dados dinâmicos: `priceFull`, `priceCash`, `installmentsCount`, `installmentEntry`, `installmentValue`, `priceNote`

**Página 6 — Contato (`ContactPage.tsx`)**
- Fundo rose `#9B6B7B`, texto `#F0DCC8`
- "Siga nas redes sociais" (label), "@quadraarq" em Cormorant Garamond 42px
- Divider, contatos de Camilla e Mariana
- "Obrigada pela confiança." em itálico Cormorant Garamond

### 3. Atualizar `ProposalPageRenderer.tsx`

Simplificar `buildProposalPages` para gerar exatamente 6 páginas:
1. CoverPage
2. AboutPage
3. ScopeFlowPage (nova)
4. ManagementFullPage (nova)
5. WhyHireValuesPage (nova)
6. ContactPage

Remover referências a PillarPage, SeparatorPage, PortfolioPage, FeedbackPage individuais (os componentes ficam no projeto mas não são usados no build).

### 4. Atualizar `generateProposalPdf.ts`

Ajustar as dimensões do jsPDF para corresponder a 595×842 pontos (já é quase A4, mas o ratio muda levemente). Manter scale 2 e JPEG 0.92.

### 5. Não criar Edge Function com Puppeteer

O Lovable Cloud não suporta Puppeteer em Edge Functions. O sistema atual usa html2canvas + jsPDF no client-side, que funciona bem. Manteremos essa abordagem.

### Arquivos criados/editados

| Arquivo | Ação |
|---|---|
| `index.html` | Adicionar link Google Fonts (Cormorant Garamond + Jost) |
| `src/components/leads/proposal-pages/shared.tsx` | Atualizar PAGE_W/PAGE_H, fontFamily |
| `src/components/leads/proposal-pages/CoverPage.tsx` | Redesign completo |
| `src/components/leads/proposal-pages/AboutPage.tsx` | Redesign layout 2 colunas |
| `src/components/leads/proposal-pages/ScopeFlowPage.tsx` | Novo: escopo + processo em 1 página |
| `src/components/leads/proposal-pages/ManagementFullPage.tsx` | Novo: 6 pilares em grid 3×2 |
| `src/components/leads/proposal-pages/WhyHireValuesPage.tsx` | Novo: why hire + valores |
| `src/components/leads/proposal-pages/ContactPage.tsx` | Redesign |
| `src/components/leads/ProposalPageRenderer.tsx` | Simplificar para 6 páginas |
| `src/lib/generateProposalPdf.ts` | Ajustar dimensões |

