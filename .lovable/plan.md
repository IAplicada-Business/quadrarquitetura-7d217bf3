

## Correção — Geração de Proposta (4 bugs)

### Diagnóstico

**BUG 1 — Pilares sem bullets**: O `PillarPage.tsx` lê `pillarTexts?.[config.textKey]`, mas esses textos vêm de `proposal_assets` (categoria "text", metadata key "pilar_planejamento" etc). Se nenhum asset foi cadastrado no banco, `pillarTexts` fica vazio e nenhum bullet aparece. **Solução**: Hardcodar os textos default de cada pilar diretamente no `PillarPage.tsx` como fallback.

**BUG 2 — Valores incompletos**: O componente `ValuesPage.tsx` já tem a lógica correta para mostrar valor cheio riscado, desconto, parcelas e nota. O problema é que o valor cheio só aparece riscado quando `priceCash < priceFull` — se o usuário preencheu apenas `price_full`, aparece só um valor. Quando ambos são iguais ou `priceCash` não existe, o layout fica incompleto. **Solução**: Ajustar a lógica para sempre mostrar `priceFull` em destaque, e mostrar `priceCash` separado quando diferente.

**BUG 3 — Portfólio e Feedbacks**: O `ProposalPageRenderer.tsx` já tem toda a lógica de portfólio e feedbacks implementada. O formulário já tem checkboxes. Se não aparecem no PDF, é porque o usuário não cadastrou assets ou não selecionou nenhum. O código está correto. **Verificação**: Garantir que a ordem das seções está correta (separador "Nossos Trabalhos" antes do portfólio, não depois do "Why Hire").

**BUG 4 — Formulário**: O formulário `ProposalFormNew.tsx` já tem TODOS os campos (price_full, price_cash, installments_count, installment_entry, installment_value auto-calculado, price_note). Está completo.

---

### Edições necessárias

#### 1. `src/components/leads/proposal-pages/PillarPage.tsx`
- Adicionar constante `DEFAULT_PILLAR_TEXTS` com todos os 6 textos de pilares hardcoded (os textos fornecidos pelo usuário)
- Na linha 22, usar fallback: `pillarTexts?.[config.textKey] || DEFAULT_PILLAR_TEXTS[config.textKey] || ""`

#### 2. `src/components/leads/proposal-pages/ValuesPage.tsx`
- Refatorar layout para sempre exibir `priceFull` quando disponível
- Mostrar `priceFull` riscado APENAS quando `priceCash` existe e é menor
- Sempre mostrar a seção "Formas de Pagamento" quando `installmentsCount` ou `priceCash` existir
- Garantir que `priceNote` sempre aparece

#### 3. `src/components/leads/ProposalPageRenderer.tsx`
- Reordenar seções: mover separador "Nossos Trabalhos:" + portfólio para ANTES de "Why Hire"
- Remover duplicação de portfólio (atualmente aparece 2x: uma antes e outra depois de Why Hire)
- Manter feedbacks após Why Hire

Nenhuma mudança no banco de dados é necessária.

