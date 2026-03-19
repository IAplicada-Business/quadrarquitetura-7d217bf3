

## Ajustar posição da imagem — AboutPage

### Problema
O `objectPosition: "top"` ficou extremo demais, cortando a parte inferior. Precisa de um valor intermediário.

### Solução
Mudar `objectPosition` de `"top"` para `"top 20%"` (ou `"center top"` com offset) na linha 26, para mostrar um pouco mais do centro da foto sem cortar os rostos.

### Edição: `AboutPage.tsx` linha 26
- Alterar `objectPosition: "top"` → `objectPosition: "20% 0%"` para subir a imagem levemente sem ir ao extremo topo.

