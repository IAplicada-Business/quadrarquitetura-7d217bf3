

## Parcelamento Automático de Pagamentos

### Migration SQL

```sql
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS parent_payment_id uuid REFERENCES payments(id) ON DELETE CASCADE;
```

### `src/components/projects/PaymentForm.tsx`

Replace manual installment fields with toggle-based auto-parcelamento:

- **Toggle "Parcelar pagamento"** (Switch component) — hidden when editing
- When enabled, show:
  - Número de parcelas (1-24, Input number)
  - Data da primeira parcela (Input date)
  - Intervalo (Select: Semanal 7d / Quinzenal 15d / Mensal 30d / Personalizado + Input dias)
- **Preview automático**: `useMemo` calculates N installment rows with dates and values (`total / N`, last absorbs cents rounding)
- When toggle OFF, form works as today (single payment)
- **onSubmit change**: When parcelamento active, return array-like data structure with `installments` array instead of single payment. New prop `onSubmitInstallments` or modify `onSubmit` signature to accept installments mode.

### `src/hooks/useProjectPayments.ts`

Add `createInstallments` mutation:
- Receives: `{ base data, numParcelas, firstDate, intervalDays }`
- Calculates dates and values
- Inserts first payment, gets its ID back
- Inserts remaining N-1 payments with `parent_payment_id = first.id`
- Each has `installment_number`, `total_installments`, `description = "[desc] — Parcela X/N"`

Add `payRemaining` mutation:
- Takes `parent_payment_id` (or first installment ID)
- Updates all unpaid payments in the group to `status = 'pago'`, `paid_date = today`

### `src/components/projects/ProjectFinancialTab.tsx`

**Payments table changes**:
- Group installments visually: show parent row with badge "X/N" clickable
- When badge clicked, toggle showing child installments inline (indented)
- Add "Quitar restantes" button on parent row when group has unpaid items
- Wire `createInstallments` from hook when form submits with parcelamento
- Non-installment payments (no `installment_number`) unchanged

### Dashboard Obras — not changing per user request scope (only mentions it but says "não altere nenhuma outra aba")

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | Add `parent_payment_id` to payments |
| `src/components/projects/PaymentForm.tsx` | Toggle parcelamento, preview de parcelas, intervalo |
| `src/hooks/useProjectPayments.ts` | `createInstallments` + `payRemaining` mutations |
| `src/components/projects/ProjectFinancialTab.tsx` | Badge X/N expandível, botão "Quitar restantes" |

