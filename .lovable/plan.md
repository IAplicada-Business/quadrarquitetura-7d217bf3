

## Corrigir quebra de linha no último conector da página 4

### Problema
O label "em torno de\n25 dias" tem `\n` forçando quebra de linha no conector.

### Solução
Alterar linha 74 do `FlowPage.tsx`: remover o `\n` para ficar em uma única linha.

### Edição: `FlowPage.tsx` linha 74
- De: `` `em torno de\n${timelineConstruction} dias` ``
- Para: `` `em torno de ${timelineConstruction} dias` ``

