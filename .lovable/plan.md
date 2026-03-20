

## Centralizar foto na Página 2 (Quem Somos)

### Problema
A foto está com `marginTop: -40` que a desloca para cima, cortando parte da imagem e desalinhando-a em relação ao texto da coluna direita.

### Solução

No container da coluna esquerda (linha 18), usar `display: "flex"`, `alignItems: "center"`, `justifyContent: "center"` para centralizar a imagem verticalmente em relação ao conteúdo da coluna direita. Remover o `marginTop: -40` da imagem.

A imagem continuará com `width: "100%"` e `height: "auto"` (compatível com html2canvas), e o `overflow: hidden` no container cortará qualquer excesso mantendo a proporção.

### Arquivo editado

| Arquivo | Mudança |
|---|---|
| `src/components/leads/proposal-pages/AboutPage.tsx` | Container esquerdo: adicionar flex centering. Imagem: remover marginTop negativo. |

