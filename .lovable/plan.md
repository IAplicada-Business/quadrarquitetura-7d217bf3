

## Corrigir geracão de PDF da proposta

### Problema
O `handleGeneratePdf` usa `ReactDOM.createRoot().render()` que é assíncrono. O timeout de 2 segundos não garante que o conteúdo foi renderizado. Além disso, o componente renderizado offscreen pode não ter acesso ao contexto React necessário (QueryClient, etc.) e as imagens podem não carregar no container oculto.

### Solução
Substituir a renderização offscreen com `createRoot` por `flushSync` do `react-dom` para forçar renderização síncrona, e aguardar que todas as imagens carreguem antes de capturar com `html2canvas`.

### Edições

**`src/pages/LeadsProposals.tsx`** — reescrever `handleGeneratePdf`:

1. Importar `flushSync` de `react-dom`
2. Usar `flushSync` dentro de `createRoot().render()` para garantir renderização síncrona
3. Aguardar carregamento de todas as imagens no container antes de capturar
4. Adicionar melhor tratamento de erros com logs

```tsx
import { flushSync } from "react-dom";

// No handleGeneratePdf:
for (let i = 0; i < pages.length; i++) {
  const pageDiv = document.createElement("div");
  container.appendChild(pageDiv);
  const root = ReactDOM.createRoot(pageDiv);
  flushSync(() => {
    root.render(pages[i]);
  });
  pageElements.push(pageDiv);
  roots.push(root);
}

// Aguardar imagens carregarem
const allImages = container.querySelectorAll("img");
await Promise.all(
  Array.from(allImages).map(img =>
    img.complete ? Promise.resolve() : new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    })
  )
);

// Pequeno delay adicional para layout
await new Promise(resolve => setTimeout(resolve, 500));
```

5. Separar o download do upload — fazer download mesmo se upload falhar, para o usuário não perder o PDF

