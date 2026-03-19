

## Separar visualmente o Sidebar do Header

### Problema
O sidebar e o header usam a mesma cor (`bg-sidebar` = azul-marinho escuro), tornando-os visualmente indistinguíveis.

### Solução
Mudar o **sidebar** para um tom neutro claro (off-white/cinza claro), mantendo o header no azul-marinho atual. Isso cria hierarquia visual clara.

### Mudanças

**1. `src/index.css`** — Novas variáveis CSS para o sidebar (tom neutro):
- `--sidebar-background`: branco/off-white (`0 0% 100%` ou `40 10% 97%`)
- `--sidebar-foreground`: texto escuro (`210 20% 30%`)
- `--sidebar-accent`: hover cinza claro (`210 10% 93%`)
- `--sidebar-accent-foreground`: texto escuro
- `--sidebar-border`: borda cinza sutil (`210 10% 90%`)
- `--sidebar-primary`: azul-marinho para item ativo
- Dark mode: equivalentes escuros neutros (cinza escuro em vez de azul)

**2. `src/components/layout/AppSidebar.tsx`** — Ajustar classes de texto:
- Grupo labels: mudar `text-sidebar-foreground` (já funciona com as novas variáveis)
- Logo area: o fundo neutro mostrará a logo clara sobre branco — usar logo escura ou manter border-bottom como separador visual

**3. `src/components/layout/AppHeader.tsx`** — Manter como está (`bg-sidebar` será o header azul-marinho)
- Na verdade, o header deve usar classes próprias em vez de `bg-sidebar`. Trocar para `bg-primary text-primary-foreground` para que não dependa das variáveis do sidebar que vamos clarear.

### Resumo de edições
| Arquivo | Ação |
|---|---|
| `src/index.css` | Sidebar vars → neutro claro |
| `src/components/layout/AppHeader.tsx` | Trocar `bg-sidebar` → `bg-primary text-primary-foreground` + ajustar borders/hover |
| `src/components/layout/AppSidebar.tsx` | Verificar se a logo precisa de versão escura; ajustar se necessário |

