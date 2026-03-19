

## Corrigir página "Quem Somos" — watermark visível e foto desfocada no PDF

### Problemas identificados

1. **Watermark "QUADRA ARQUITETURA" aparecendo atrás da foto** — linha 10-12 do `AboutPage.tsx` renderiza um texto grande com `opacity: 0.05`. Na tela parece sutil, mas no PDF exportado fica visível por trás da imagem.

2. **Foto desfocada no PDF** — o `html2canvas` usa `scale: 2` em `generateProposalPdf.ts`, mas a resolução da imagem capturada e a compressão JPEG a 0.92 podem degradar a foto. Aumentar o scale para 3 e a qualidade JPEG para 0.95 melhorará a nitidez.

### Edições

**`src/components/leads/proposal-pages/AboutPage.tsx`**
- Remover o bloco do watermark (linhas 9-12) — o `<div>` com "QUADRA ARQUITETURA"

**`src/lib/generateProposalPdf.ts`**
- Linha 26: `scale: 2` → `scale: 3` (maior resolução de captura)
- Linha 32: qualidade JPEG de `0.92` → `0.95`
- Alterar formato de `"image/jpeg"` para `"image/png"` para evitar artefatos de compressão na foto

