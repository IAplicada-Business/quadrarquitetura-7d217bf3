

## Historico de Contratacoes de Fornecedores

### Migration SQL

```sql
-- Use validation trigger instead of CHECK constraint
ALTER TABLE supplier_allocations
  ADD COLUMN IF NOT EXISTS contracted_value numeric,
  ADD COLUMN IF NOT EXISTS final_value numeric,
  ADD COLUMN IF NOT EXISTS rating integer;

CREATE OR REPLACE FUNCTION public.validate_supplier_allocation_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.rating IS NOT NULL AND (NEW.rating < 1 OR NEW.rating > 5) THEN
    RAISE EXCEPTION 'Rating deve ser entre 1 e 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_supplier_allocation_rating
  BEFORE INSERT OR UPDATE ON supplier_allocations
  FOR EACH ROW EXECUTE FUNCTION validate_supplier_allocation_rating();
```

### Novo componente: `src/components/construction/SupplierDetailSheet.tsx`

Sheet lateral aberto ao clicar no card do fornecedor. Tres secoes:

1. **Historico de Obras**: Query `supplier_allocations` filtrado por `supplier_id`, join com `projects(name)`. Tabela com Projeto, Disciplina, Valor Contratado, Valor Final, Avaliacao (estrelas), Data, Observacoes. Rodape com totais: N obras, valor medio contratado, desvio medio contratado-final em %.

2. **Comparativo de Precos**: Query todos os `supplier_allocations` da mesma disciplina/categoria, agrupados por supplier. Grafico de barras (Recharts `BarChart`) com valor medio por fornecedor, ordenado do mais barato ao mais caro. Destaque visual no fornecedor atual.

3. **Avaliacao Consolidada**: Media das avaliacoes com estrelas. Ultimas 3 observacoes com data.

### `src/pages/Suppliers.tsx`

- Adicionar estado `selectedSupplier` para controlar abertura do Sheet
- Ao clicar no Card (area do card, nao nos botoes edit/delete), abrir `SupplierDetailSheet`
- Manter CRUD existente intacto

### `src/hooks/useSupplierAllocations.ts`

- Atualizar interface `SupplierAllocation` com `contracted_value`, `final_value`, `rating`
- Adicionar mutation `update` para editar alocacoes existentes (usado na avaliacao)
- Adicionar query `bySupplier(supplierId)` — busca todas as alocacoes de um fornecedor especifico

### Novo componente: `src/components/construction/SupplierRatingDialog.tsx`

Modal de avaliacao rapida:
- Estrelas (1-5) clicaveis
- Campo de observacao (textarea opcional)
- Valor final pago (input numeric, pre-preenchido com contracted_value)
- Salva via update mutation no `supplier_allocations`

### `src/components/projects/ProjectTrackingTab.tsx`

Quando uma atividade vinculada a fornecedor (via `supplier_allocations`) for marcada como concluida, exibir toast com acao: "Avaliar [nome] para esta etapa?" que abre `SupplierRatingDialog`.

### Arquivos alterados

| Arquivo | Acao |
|---|---|
| Migration SQL | 3 colunas + trigger de validacao em `supplier_allocations` |
| `src/components/construction/SupplierDetailSheet.tsx` | **Novo** — painel lateral com historico, comparativo e avaliacao |
| `src/components/construction/SupplierRatingDialog.tsx` | **Novo** — modal de avaliacao rapida |
| `src/pages/Suppliers.tsx` | Abrir Sheet ao clicar no fornecedor |
| `src/hooks/useSupplierAllocations.ts` | Campos novos, mutation update, query por supplier |
| `src/components/projects/ProjectTrackingTab.tsx` | Sugestao de avaliacao ao concluir atividade |

Nenhuma outra rota, aba ou funcionalidade alterada.

