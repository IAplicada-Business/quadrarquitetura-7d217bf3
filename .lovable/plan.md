

## Formato 16:9 para apresentação

### Contexto
A geração de PDF é client-side com html2canvas + jsPDF. Não há Edge Function envolvida. A solução requer que os componentes de página aceitem dimensões variáveis e que o `generateProposalPdf` suporte modo landscape.

### Edições

**1. `src/components/leads/proposal-pages/shared.tsx`**
- Adicionar constantes `PAGE_W_16_9 = 1280` e `PAGE_H_16_9 = 720`
- Atualizar `PageContainer` para aceitar props opcionais `width` e `height` (default: PAGE_W, PAGE_H)

**2. `src/lib/generateProposalPdf.ts`**
- Adicionar parâmetro `formato?: "a4" | "apresentacao"` à função
- Quando `"apresentacao"`: usar orientação landscape, dimensões 1280×720 no html2canvas e PDF em pontos proporcionais (960×540pt ou similar ratio)
- Default continua A4 portrait

**3. `src/components/leads/ProposalFormNew.tsx`**
- Adicionar segundo callback `onGeneratePdfApresentacao` ao interface
- Novo botão "Gerar Apresentação (16:9)" ao lado do botão existente, com ícone diferente (ex: Monitor)

**4. `src/pages/LeadsProposals.tsx`**
- Nova função `handleGeneratePdf16x9` que:
  - Chama `buildPages` com um flag/prop indicando formato 16:9
  - Renderiza os componentes com dimensões 1280×720 (passando width/height ao PageContainer)
  - Chama `generateProposalPdf` com `formato: "apresentacao"`
- Passar `onGeneratePdfApresentacao` ao form

**5. `src/components/leads/ProposalPageRenderer.tsx`**
- `buildProposalPages` aceita parâmetro opcional `formato`
- Passa `pageWidth` e `pageHeight` como props aos componentes de página

**6. Componentes de página (CoverPage, AboutPage, ScopeFlowPage, etc.)**
- Atualizar `PageContainer` usage para respeitar `width`/`height` das props
- Como todos usam `PageContainer` centralmente, a maioria das páginas não precisa de mudanças manuais — o container se adapta
- Fontes e espaçamentos escalam via `scale = width / PAGE_W` (~2.15× para 1280/595)

### Abordagem de escala
Em vez de alterar cada componente individualmente, usar CSS `transform: scale()` no PageContainer quando em modo 16:9. Renderizar o conteúdo nas dimensões originais (595×842) dentro de um container 1280×720 com `transform: scale(X) translate(...)` e `transformOrigin: "top left"`. Isso mantém todos os layouts e fontes proporcionais sem tocar em cada página.

Alternativa mais simples: manter os componentes em 595×842 e usar `html2canvas` com `width: 1280, height: 720` + CSS transform no container wrapper. O html2canvas captura o resultado escalado.

### Arquivos editados

| Arquivo | Ação |
|---|---|
| `src/lib/generateProposalPdf.ts` | Adicionar suporte a formato landscape 16:9 |
| `src/components/leads/proposal-pages/shared.tsx` | Constantes 16:9, PageContainer adaptável |
| `src/components/leads/ProposalFormNew.tsx` | Novo botão "Gerar Apresentação" |
| `src/pages/LeadsProposals.tsx` | Handler para gerar PDF 16:9 |
| `src/components/leads/ProposalPageRenderer.tsx` | Aceitar formato e passar dimensões |

Nenhuma rota ou funcionalidade existente será alterada.

