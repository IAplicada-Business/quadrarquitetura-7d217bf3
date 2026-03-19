

## Corrigir imagem desfocada/alargada no PDF — Página "Quem Somos"

### Problema

O `html2canvas` não respeita `object-fit: cover` nem `object-position` ao capturar imagens. Ele renderiza a imagem esticada para preencher o container (width/height 100%), ignorando essas propriedades CSS. Resultado: foto alargada e desfocada no PDF.

### Solução

Na `AboutPage.tsx`, trocar o approach de `object-fit: cover` por dimensões explícitas que mantêm a proporção natural da foto. Em vez de forçar a imagem em um container 500x400 com `object-fit`, usar um container que se adapta à proporção da imagem, ou usar `object-fit: contain` que o html2canvas lida melhor.

A abordagem mais confiável para html2canvas: usar a imagem com largura fixa e deixar a altura ser automática (sem forçar height: 100%), evitando distorção.

### Edições

**`src/components/leads/proposal-pages/AboutPage.tsx`**
- Container da foto: remover `height: 400` fixo, usar `maxHeight: 400` com `overflow: hidden`
- Imagem: trocar `width: "100%", height: "100%", objectFit: "cover"` por `width: "100%", height: "auto"` — isso garante que a imagem mantém proporção natural e html2canvas a captura sem distorção
- Manter `objectPosition` para ajuste vertical via margem negativa se necessário

