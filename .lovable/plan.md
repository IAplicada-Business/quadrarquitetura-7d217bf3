

## Corrigir dois botões X no modal de preview

### Problema
O modal tem dois X: um do `DialogContent` (do Radix, automático na linha do `dialog.tsx`) e outro manual na toolbar (linha 45 do `ProposalPreviewModal.tsx`).

### Solução
Remover o botão X manual da toolbar do `ProposalPreviewModal.tsx` (linha 45), mantendo apenas o X nativo do `DialogContent`.

### Edição: `ProposalPreviewModal.tsx`
- Remover a linha `<Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button>` da toolbar
- Remover o import de `X` do lucide-react (já não será usado)

