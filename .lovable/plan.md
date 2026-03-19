

## Converter Proposta para Formato A4 Retrato (PDF)

### Problema
A proposta atual usa dimensoes landscape (1456x816px) — formato tipo apresentacao. O usuario quer formato **A4 retrato** (portrait), como um PDF profissional. Alem disso, layouts estao cortados/desalinhados por causa da largura fixa.

### Mudanca Central
- `PAGE_W` de 1456 → **794** pixels
- `PAGE_H` de 816 → **1123** pixels (ratio A4: 210x297mm)
- PDF orientation de "landscape" → **"portrait"**, format "a4"

### Arquivos a editar (13 arquivos)

**1. `shared.tsx`** — Dimensoes A4
- `PAGE_W = 794`, `PAGE_H = 1123`
- Ajustar `DecorativeShape` para tamanho proporcional menor (120px)

**2. `generateProposalPdf.ts`** — PDF portrait
- `orientation: "portrait"`, `format: "a4"`, `unit: "pt"` (595x842pt A4)
- Ajustar addImage para dimensoes A4 em pontos

**3. `CoverPage.tsx`** — Reduzir fontes (h1: 48, h2: 32, h3: 24), logo menor

**4. `AboutPage.tsx`** — Layout empilhado vertical (texto acima, fotos abaixo lado a lado) em vez de horizontal. Watermark menor (fontSize 60). Fotos 120x120px.

**5. `ScopePage.tsx`** — Padding menor (60px 60px), fonte 16px, maxWidth 650

**6. `FlowPage.tsx`** — Arrows menores (width 180), DaysBadge minWidth 50. Row 2 tambem centralizado. Titulo fontSize 28. Subtextos com width correspondente.

**7. `ManagementPage.tsx`** — Grid 3x2 em vez de 6 colunas. Icones 44px, labels 12px.

**8. `PillarPage.tsx`** — Layout empilhado (icone + titulo no topo, bullets abaixo). Icone 80px, titulo 26px, bullets 15px.

**9. `PortfolioPage.tsx`** — Grid 2 colunas mantido, padding menor (30px 40px), titulo 22px.

**10. `WhyHirePage.tsx`** — Grid 2x2 em vez de 4 colunas. Icones 40px, texto 13px.

**11. `ValuesPage.tsx`** — Fontes menores (titulo 40px, preco 36px), padding 60px 60px.

**12. `ContactPage.tsx`** — Telefones empilhados verticalmente, fontes menores.

**13. `SeparatorPage.tsx`** — Titulo 36px em vez de 52px.

**14. `FeedbackPage.tsx`** — Padding menor, grid mantido 2x2.

### Principio
Todos os layouts horizontais que dependiam de 1456px de largura serao convertidos para empilhamento vertical ou grids menores (2 colunas max), aproveitando a altura maior do A4 retrato.

