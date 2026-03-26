

## Melhorar qualidade do PDF — fontes, escala e imagens

### Problemas identificados

1. **Sem preload de fontes**: O `html2canvas` captura o DOM offscreen, mas não há garantia de que Cormorant Garamond e Jost estejam carregadas. O delay de 500ms é um palpite — pode não ser suficiente.

2. **Scale 2x pode ser insuficiente para texto fino**: No formato 16:9, o `transform: scale()` comprime texto verticalmente, e a captura a 2x pode gerar artefatos em fontes serifadas pequenas.

3. **Imagens CORS**: `useCORS: true` + `allowTaint: true` são contraditórios — `allowTaint` desabilita a proteção CORS do canvas, o que pode causar falhas silenciosas em alguns browsers.

### Edições

**1. `src/lib/generateProposalPdf.ts`**
- Adicionar função `waitForFonts()` que usa `document.fonts.ready` + carrega explicitamente "Cormorant Garamond" e "Jost" via `document.fonts.load()`
- Chamar `waitForFonts()` antes do loop de captura
- Aumentar `scale` de 2 para 3 para melhor nitidez
- Remover `allowTaint: true` (conflita com `useCORS`)
- Usar PNG em vez de JPEG para texto mais nítido (troca `toDataURL("image/jpeg", 0.92)` por `toDataURL("image/png")`)

**2. `src/pages/LeadsProposals.tsx`**
- Substituir o `setTimeout(500ms)` fixo por chamada a `waitForFonts()` exportada + `document.fonts.ready`
- Manter o wait de imagens existente

### Detalhes técnicos da função `waitForFonts`

```typescript
async function waitForFonts() {
  const fontFaces = [
    "300 16px 'Cormorant Garamond'",
    "400 16px 'Cormorant Garamond'",
    "600 16px 'Cormorant Garamond'",
    "700 16px 'Cormorant Garamond'",
    "300 16px 'Jost'",
    "400 16px 'Jost'",
    "500 16px 'Jost'",
    "600 16px 'Jost'",
  ];
  await Promise.all(fontFaces.map(f => document.fonts.load(f)));
  await document.fonts.ready;
}
```

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/lib/generateProposalPdf.ts` | Font preload, scale 3x, PNG, remover allowTaint |
| `src/pages/LeadsProposals.tsx` | Substituir setTimeout por waitForFonts em ambos handlers |

