

## Corrigir alinhamento uniforme dos 5 steps na Página 3

### Problema
Os badges de tempo ficam desalinhados verticalmente porque os steps têm alturas variáveis e o step 5 ("Início da Obra") não tem badge, quebrando o alinhamento visual.

### Edições em `src/components/leads/proposal-pages/ScopeFlowPage.tsx`

**Container de cada step (linha 116):** Adicionar `display: "flex"`, `flexDirection: "column"`, `alignItems: "center"`, `minHeight: 120`.

**Descrição `<p>` (linha 181):** Adicionar `minHeight: 28` para reservar espaço uniforme.

**Badge de dias (linhas 182-197):** Substituir o condicional `{step.days && ...}` por renderização sempre presente. Quando `step.days` estiver vazio, renderizar um `<span>` invisível com mesma altura (22px). Atualizar o estilo do badge para: `minWidth: 52`, `height: 22`, `lineHeight: "22px"`, `textAlign: "center"`, `borderRadius: 11`, `padding: "0 8px"`, `whiteSpace: "nowrap"`.

