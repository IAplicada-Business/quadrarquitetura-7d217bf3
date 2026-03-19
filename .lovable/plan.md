

## Ajuste da Capa — Reenquadrar foto + Logo

### Problemas
1. A foto das sócias está sendo cortada nos rostos porque `objectFit: cover` em container landscape (1456x816) corta o centro vertical de uma foto vertical/quadrada
2. A logo já está condicionada a `logoUrl` mas precisa aparecer sempre (usar logo dos assets ou fallback)

### Correções em `CoverPage.tsx`

1. **Reenquadrar foto**: Adicionar `objectPosition: "top center"` (ou `"50% 25%"`) ao `<img>` para priorizar a parte superior da imagem onde estão os rostos, em vez do centro padrão
2. **Logo sempre visível**: A logo já renderiza quando `logoUrl` existe — o componente está correto. Garantir que no formulário/preview a `logoUrl` seja passada. Caso não haja logo cadastrada, usar um fallback textual "QUADRA" no canto inferior direito

### Arquivo editado
- `src/components/leads/proposal-pages/CoverPage.tsx` — ajustar `objectPosition` e adicionar fallback de logo

