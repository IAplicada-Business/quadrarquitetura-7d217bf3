

## Corrigir cálculo e separar Valores em página independente

### Problema 1 — Cálculo
Atualmente `priceFull` e `priceCash` são campos independentes no formulário. O usuário digita ambos manualmente. A correção: `priceCash` deve ser calculado automaticamente como `priceFull * (1 - desconto/100)`. Precisa adicionar um campo `discount_percent` ao formulário e calcular `priceCash` derivado.

Porém, olhando o formulário, já existem `price_full` e `price_cash` como campos separados. A correção mais simples: substituir o campo `price_cash` por um campo "Desconto à vista (%)" e calcular o valor à vista automaticamente.

### Problema 2 — Separação de páginas
Remover a seção de valores do `WhyHireValuesPage` (que passa a ser só `WhyHirePage`) e criar um novo componente `ValuesPage` como página independente.

### Edições

**1. `src/components/leads/ProposalFormNew.tsx`**
- Substituir o campo `price_cash` por `discount_cash_percent` (número, 0-100)
- Calcular `price_cash` derivado: `price_full * (1 - discount/100)` e passá-lo no formData
- Exibir o valor à vista calculado como texto informativo abaixo do campo de desconto

**2. `src/components/leads/proposal-pages/WhyHireValuesPage.tsx` → renomear para `WhyHirePage.tsx` (já existe, reutilizar)**
- Remover toda a seção de valores (linhas 109-196) do componente atual
- Manter apenas os 4 cards "Por que contratar"
- Renomear export para `ProposalWhyHirePage`

**3. Novo `src/components/leads/proposal-pages/ValuesPage.tsx`** (já existe no codebase mas não está em uso)
- Redesign com as specs solicitadas:
  - Fundo azul `#1B2A4A`
  - Título "VALORES" — Cormorant Garamond, 52px, letter-spacing 8px, cor `#F0DCC8`
  - Linha divisória `#C4756E`, 48px, centralizada
  - Dois boxes lado a lado com padding generoso, valor principal em Cormorant Garamond 36px
  - Nota de rodapé em itálico, opacity 0.5

**4. `src/components/leads/ProposalPageRenderer.tsx`**
- Importar `ProposalWhyHirePage` (sem valores) e `ProposalValuesPage`
- Inserir ambas como páginas separadas: WhyHire → Values → Contact
- Remover import do antigo `WhyHireValuesPage`

**5. `src/pages/LeadsProposals.tsx`**
- Ajustar `buildPageProps` para calcular `priceCash` a partir de `price_full` e `discount_cash_percent` se necessário

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/leads/ProposalFormNew.tsx` | Editar — campo de desconto % em vez de valor à vista manual |
| `src/components/leads/proposal-pages/WhyHireValuesPage.tsx` | Editar — remover seção de valores, manter só "Por que contratar" |
| `src/components/leads/proposal-pages/ValuesPage.tsx` | Editar — redesign com specs solicitadas |
| `src/components/leads/ProposalPageRenderer.tsx` | Editar — adicionar ValuesPage como página separada |
| `src/pages/LeadsProposals.tsx` | Editar — ajustar cálculo de priceCash |

