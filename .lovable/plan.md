

## Fluxo vertical na página 4

### Problema
O fluxo atual usa layout horizontal em duas linhas com setas lado a lado, ficando apertado e cortado na página A4 portrait.

### Solução
Refatorar para layout **vertical** — cada etapa empilhada de cima para baixo, com seta apontando para baixo entre elas, centralizado na página.

### Edição: `FlowPage.tsx`

1. **Substituir `ArrowShape` horizontal** por um componente de etapa vertical:
   - Retângulo arredondado (largura ~500px, altura ~70px) com título da etapa
   - Alternando cores roseMauve / azulMarinho
   - Subtexto logo abaixo do retângulo

2. **Seta/conector vertical** entre etapas:
   - Linha vertical + badge de dias (ex: "4 DIAS") entre cada etapa
   - Altura ~40px entre blocos

3. **Layout geral**:
   - `flexDirection: "column"`, `alignItems: "center"`, `justifyContent: "center"`
   - Título "COMO FUNCIONA NOSSO SERVIÇO?" no topo
   - 5 blocos empilhados verticalmente com conectores de dias entre eles
   - Logo pequena no rodapé

4. **Remover** as funções `ArrowShape` e `DaysBadge` atuais, substituindo por componentes verticais `StepBlock` e `DaysConnector`.

