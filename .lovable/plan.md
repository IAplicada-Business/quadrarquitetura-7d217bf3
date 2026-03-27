
## Ajuste solicitado: consolidar remoção de `price_cash` e padronizar cálculo em runtime

### Estado atual do sistema
- A migration para remover `price_cash` já existe:
  ```sql
  ALTER TABLE public.proposals DROP COLUMN IF EXISTS price_cash;
  ```
- O formulário e a página `LeadsProposals.tsx` já migraram a lógica principal para cálculo em runtime usando `discount_cash_percent -> discount_percent`.
- O hook `useProposals` já não tipa `price_cash`.
- Não encontrei `ValuesPageLandscape` no repositório atual; o formato apresentação reutiliza a mesma `ValuesPage`.

### O que ainda precisa ser ajustado
1. Padronizar a regra de cálculo em um único critério:
   ```ts
   const priceAtVista =
     proposal.price_full && (proposal.discount_percent ?? 0) > 0
       ? proposal.price_full * (1 - (proposal.discount_percent ?? 0) / 100)
       : null;
   ```
2. Garantir a mesma regra em todos os pontos:
   - preview em tempo real no formulário
   - props passadas para o PDF em `LeadsProposals.tsx`
   - `ValuesPage.tsx`
   - métricas do dashboard, se houver qualquer leitura indireta de valor final com desconto

### Arquivos a ajustar

**1. `src/components/leads/ProposalFormNew.tsx`**
- Manter `discount_cash_percent` apenas como campo de UI
- Renomear/ajustar o cálculo local (`calcPriceCash`) para seguir exatamente a regra:
  - se `discount_cash_percent` for `null`, `0` ou ausente: `null`
  - se for `> 0`: calcular valor à vista
- O texto de preview abaixo do campo de desconto deve aparecer somente quando houver desconto positivo

**2. `src/pages/LeadsProposals.tsx`**
- Em `buildPageProps`, manter `priceCash` apenas como valor derivado em runtime
- Padronizar o cálculo para não depender de truthy/falsy de `price_full`
- Em `handleSave`, continuar salvando:
  - `price_full`
  - `discount_percent: formData.discount_cash_percent`
- `final_value` deve continuar sendo calculado em runtime com a mesma fórmula, sem qualquer referência a `price_cash`
- Revisar a carga inicial (`editInitialData`) para garantir que tudo vem de `price_full` + `discount_percent`

**3. `src/components/leads/proposal-pages/ValuesPage.tsx`**
- Ajustar a condição de exibição da linha “À vista” para depender explicitamente de `priceCash !== null` e `priceCash < priceFull`
- Resultado esperado:
  - sem desconto: mostra só valor cheio
  - com desconto: mostra valor cheio + linha “À vista”

**4. `src/hooks/useProposals.ts`**
- Confirmar que o retorno tipado continua sem `price_cash`
- Opcionalmente restringir o `select` para colunas usadas, evitando qualquer dependência implícita do schema antigo

### Sobre dashboard e queries
- No `DashboardEscritorio.tsx`, a query atual usa `price_full`, não `price_cash`
- Portanto, não há dependência direta restante de `price_cash` no dashboard atual
- Mesmo assim, vou revisar eventuais cálculos derivados para garantir consistência entre:
  - ticket médio
  - valor exibido em listas
  - qualquer uso futuro de `final_value`

### Resultado final esperado
- `price_cash` deixa de existir estruturalmente e logicamente
- O sistema passa a ter uma única fonte de verdade:
  - `price_full`
  - `discount_percent`
- O preview do formulário e o PDF passam a seguir exatamente a mesma regra visual
- Nenhuma outra tabela, rota ou funcionalidade será alterada

### Observação importante
Há um detalhe no histórico recente: `src/integrations/supabase/types.ts` apareceu como editado antes, mas esse arquivo não deve ser alterado manualmente. Na implementação, o correto é não tocar nele e depender da atualização automática do schema.
