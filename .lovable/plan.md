

## Remover `price_cash` e calcular valor à vista em runtime

### Resumo
Eliminar a coluna `price_cash` da tabela `proposals`. O valor à vista passa a ser calculado como `price_full * (1 - discount_percent / 100)` em todos os pontos de uso. O campo `discount_cash_percent` no formulário será mapeado para a coluna existente `discount_percent` do banco.

### Migration SQL
```sql
ALTER TABLE public.proposals DROP COLUMN IF EXISTS price_cash;
```

### Edições

**1. `src/components/leads/ProposalFormNew.tsx`**
- Remover `price_cash` da interface `ProposalFormData` e da inicialização
- Manter `discount_cash_percent` como campo de UI (renomear internamente ou manter — ele já calcula `calcPriceCash` em runtime)
- Nos botões de ação (Save/Preview/PDF), remover `price_cash: calcPriceCash ?? data.price_cash` do spread — não enviar mais `price_cash`

**2. `src/pages/LeadsProposals.tsx`**
- Em `buildPageProps`: substituir `priceCash: formData.price_cash` por cálculo runtime: `priceCash: formData.price_full && formData.discount_cash_percent ? formData.price_full * (1 - formData.discount_cash_percent / 100) : null`
- No payload de save: remover `price_cash`, persistir `discount_percent: formData.discount_cash_percent` em vez disso
- Na carga de dados: remover `price_cash` da leitura; carregar `discount_cash_percent` a partir de `p.discount_percent`
- Em `final_value`: calcular runtime em vez de ler `price_cash`

**3. `src/components/leads/proposal-pages/ValuesPage.tsx`**
- Nenhuma alteração necessária — já recebe `priceCash` como prop e a lógica de exibição condicional (`priceCash < priceFull`) já funciona; o valor será passado calculado pelo `buildPageProps`

**4. `src/components/leads/proposal-pages/shared.tsx`**
- Manter `priceCash` na interface `ProposalPageProps` (é prop de renderização, não de persistência)

### Lógica de exibição
- Se `discount_percent` for `null` ou `0`: não exibir linha "À vista" na ValuesPage (já funciona assim)
- Se `discount_percent > 0`: calcular e exibir `price_full * (1 - discount_percent / 100)`

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Remover coluna `price_cash` |
| `ProposalFormNew.tsx` | Remover `price_cash` do state e dos spreads de ação |
| `LeadsProposals.tsx` | Calcular em runtime no `buildPageProps` e save; mapear `discount_percent` |

