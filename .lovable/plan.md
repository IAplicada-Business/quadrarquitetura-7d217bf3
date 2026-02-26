

## Ajuste: card redondo nos botões de notificação e avatar

Aplicar o mesmo estilo `bg-secondary shadow-sm rounded-full` do botão do microfone aos botões de notificação e avatar.

### Alterações em `src/components/layout/AppHeader.tsx`

1. **Botão de notificações** (NotificationsPanel): o componente NotificationsPanel tem seu próprio botão interno, então preciso verificar esse arquivo.

2. **Avatar/usuário**: trocar o estilo do botão do avatar para incluir `bg-secondary shadow-sm`.

Preciso verificar o NotificationsPanel para ajustar o botão lá.

### Arquivos

**`src/components/layout/NotificationsPanel.tsx`** (~linha 82):
- Trocar classe do botão de `p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground` para `p-2.5 rounded-full bg-secondary text-accent shadow-sm hover:bg-secondary/80`

**`src/components/layout/AppHeader.tsx`** (~linha 107):
- Trocar classe do botão do avatar de `flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 focus:ring-offset-sidebar` para `flex items-center gap-2 p-1 rounded-full bg-secondary shadow-sm hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 focus:ring-offset-sidebar`

