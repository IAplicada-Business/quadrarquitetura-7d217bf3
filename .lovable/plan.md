

## Gerar Lista de Compras — Botão nas abas Orçamentos e Materiais

### Contexto
Criar um componente `ShoppingListDialog` que busca `budget_quotes` aprovados com `material_estimate > 0`, cruza com `material_tracking` ativos, agrupa por fornecedor, e permite copiar texto formatado para WhatsApp. Reutilizar o mesmo componente nas abas Orçamentos e Materiais.

### Alterações

**1. Novo componente `src/components/projects/ShoppingListDialog.tsx`**

- Props: `open`, `onOpenChange`, `projectId`, `projectName`
- Ao abrir, busca:
  - `budget_quotes` do projeto com `status IN ('aprovado')` e `material_estimate > 0`, incluindo `scope_items(discipline)`
  - `material_tracking` do projeto com `is_active = true` (materiais com `quantity_purchased < quantity_needed` ou sem compra)
- Agrupa por `supplier_name`
- Para cada fornecedor, exibe Card com:
  - Header: nome + total estimado (soma `material_estimate` dos quotes + valores)
  - Lista de materiais: nome, quantidade necessária, unidade
- Botão "Copiar para WhatsApp" por fornecedor — gera texto com formato especificado (`*Lista de Compras — [Obra]*`, `*Fornecedor: [Nome]*`, bullets, total, assinatura)
- Botão "Copiar tudo" — texto consolidado de todos os fornecedores
- Toast "Lista copiada para a área de transferência"

**2. Editar `src/components/projects/ProjectBudgetsTab.tsx`**

- Importar `ShoppingListDialog`
- Adicionar state `shoppingListOpen`
- Adicionar botão "Gerar Lista de Compras" no header da sub-aba "cotacoes" (ao lado do botão "Nova Revisão")
- Renderizar `<ShoppingListDialog>` com `projectId`
- Precisa do `projectName` — receber como prop ou buscar

**3. Editar `src/components/projects/ProjectMaterialsTab.tsx`**

- Importar `ShoppingListDialog`
- Adicionar state `shoppingListOpen`
- Adicionar botão "Gerar Lista de Compras" na área de ações do rastreamento (ao lado de "Importar do Orçamento")
- Renderizar `<ShoppingListDialog>`

**4. Editar `src/pages/ProjectDetail.tsx`**

- Passar `project.name` para `ProjectBudgetsTab` e `ProjectMaterialsTab` como prop `projectName`

### Arquivos criados/editados
- 1 componente criado: `ShoppingListDialog.tsx`
- 3 arquivos editados: `ProjectBudgetsTab.tsx`, `ProjectMaterialsTab.tsx`, `ProjectDetail.tsx`
- Nenhuma aba, sub-aba ou rota existente alterada

