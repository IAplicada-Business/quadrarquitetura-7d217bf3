

## Corrigir corte do rosto na foto — AboutPage

### Problema
O container da foto (500x350) usa `objectFit: "cover"`, que corta o topo da imagem onde está o rosto da mulher loira.

### Solução
Mudar `objectFit` de `"cover"` para `"contain"` e adicionar `objectPosition: "top"` como fallback. Alternativamente, aumentar a altura do container para acomodar melhor a foto sem cortar os rostos.

### Edição: `AboutPage.tsx` (linha 25-26)
- Mudar `height: 350` → `height: 400`
- Mudar `objectFit: "cover"` → `objectFit: "cover"` com `objectPosition: "top"` para priorizar o topo da imagem (rostos)

Isso garante que o crop priorize a parte superior da foto onde estão os rostos.

