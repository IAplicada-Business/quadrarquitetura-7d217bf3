

## Substituir renderText por parseSimpleMarkdown com dangerouslySetInnerHTML

### Edição única: `src/components/leads/proposal-pages/ScopeFlowPage.tsx`

1. Criar função utilitária `parseSimpleMarkdown` que converte `**bold**` → `<strong>` e `*italic*` → `<em>`
2. Remover a função `renderText` (linhas 19-30)
3. Substituir o `<p>` (linhas 81-92) que usa `{renderText(text)}` por uma `<div>` com `dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(text) }}`
4. Adicionar estilos inline para `strong` e `em` via uma tag `<style>` scoped ou usar CSS classes — como o componente usa inline styles, a abordagem mais limpa é adicionar um wrapper com className e incluir os estilos CSS no próprio componente via `<style>` tag ou inline no container

**Abordagem escolhida**: usar um wrapper `<div>` com `className="scope-markdown"` e um bloco `<style>` embutido no componente para estilizar `strong` (cor vinho `#8B4557`, fontWeight 600) e `em` (itálico).

### Arquivo

| Arquivo | Ação |
|---|---|
| `src/components/leads/proposal-pages/ScopeFlowPage.tsx` | Adicionar `parseSimpleMarkdown`, remover `renderText`, usar `dangerouslySetInnerHTML` com estilos CSS para `strong` e `em` |

