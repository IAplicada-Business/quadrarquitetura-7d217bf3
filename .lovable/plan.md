

## Corrigir cálculo da Entrada em Formas de Pagamento

### Problema
A fórmula atual em `calcInstallmentValue` (linha 103-104) calcula `(price_full - installment_entry) / (installments_count - 1)`, dividindo por `parcelas - 1` (tratando a entrada como uma das parcelas). O correto é `(price_full - installment_entry) / installments_count`.

### Edições

**1. `src/components/leads/ProposalFormNew.tsx`**
- Corrigir `calcInstallmentValue`: `(price_full - (installment_entry || 0)) / installments_count`
- Remover a condição `installments_count <= 1` — permitir 1 parcela
- Não exigir `installment_entry` para calcular (se vazio, tratar como 0)
- Adicionar preview calculado abaixo dos campos: `"Parcelas: [n]x de R$ [valor]"` quando os valores existirem
- Se `installment_entry` for 0 ou null, não exibir texto de entrada no preview

**2. `src/components/leads/proposal-pages/ValuesPage.tsx`**
- A lógica de exibição já está correta: mostra `installmentsCount x installmentValue` e `Entrada: installmentEntry` condicionalmente
- Apenas garantir que `installmentEntry` de 0 ou null não exibe a linha "Entrada"

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/leads/ProposalFormNew.tsx` | Corrigir fórmula de parcela, adicionar preview calculado |
| `src/components/leads/proposal-pages/ValuesPage.tsx` | Garantir que entrada 0 não exibe linha |

