

## Ajuste: padronizar tamanho dos botões do header

Os três botões têm tamanhos inconsistentes:
- **Microfone**: `p-2.5` com ícone `h-4 w-4` → menor
- **Notificações**: `p-2.5` com ícone `h-5 w-5` → maior
- **Avatar**: `p-1` com Avatar `h-8 w-8` → diferente

### Alterações

**`src/components/layout/AppHeader.tsx`** (linha 96):
- Microfone: trocar ícone de `h-4 w-4` para `h-5 w-5` (igual ao sino)

**`src/components/layout/AppHeader.tsx`** (linha 106):
- Avatar: trocar `p-1` para `p-0.5` e Avatar de `h-8 w-8` para `h-[30px] w-[30px]` para que o botão total fique com tamanho equivalente aos outros (~40px)

Resultado: todos os 3 botões ficam com ~40px de diâmetro total.

