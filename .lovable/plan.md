

## Correção da foto na Página 2 (Quem Somos)

### Contexto

O sistema **não usa Edge Function para gerar o PDF** — a geração é feita client-side com `html2canvas` + `jsPDF`. O arquivo `supabase/functions/generate-proposal/index.ts` apenas gera texto via IA, não HTML/PDF.

O problema de distorção da imagem está no componente `AboutPage.tsx`, que é capturado pelo `html2canvas`. O `html2canvas` não respeita `object-fit: cover` corretamente, causando distorção.

### Solução

A correção anterior (usar `height: auto`) pode ter sido revertida. Preciso reaplicar a abordagem que funciona com `html2canvas`:

**`src/components/leads/proposal-pages/AboutPage.tsx`**

- Container da coluna esquerda: definir `height: PAGE_H` (842px), `overflow: hidden`, `flexShrink: 0`
- Imagem: usar `width: "100%"`, `height: "auto"`, `display: "block"` — sem `object-fit: cover` (html2canvas ignora)
- Adicionar `marginTop: -40` ou similar para posicionar verticalmente a parte visível da foto (simula `object-position: center top`)
- Garantir que o grid usa `gridTemplateColumns: "1fr 1fr"` (já está correto)

Essa abordagem faz a imagem manter proporção natural (width 100%, height auto) e o `overflow: hidden` no container corta o excesso, simulando o efeito de `object-fit: cover` de forma compatível com html2canvas.

### Arquivo editado

| Arquivo | Ação |
|---|---|
| `src/components/leads/proposal-pages/AboutPage.tsx` | Corrigir estilos da imagem para compatibilidade com html2canvas |

Nenhuma outra página ou rota será alterada.

