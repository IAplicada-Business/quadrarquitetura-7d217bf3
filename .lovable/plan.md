

## Plano: Ícones no sidebar + modo mini colapsado

### Alterações em `src/components/layout/AppSidebar.tsx`

1. **Adicionar ícones a cada item do menu** — importar todos os ícones Lucide especificados e criar um mapa `iconMap: Record<string, LucideIcon>` vinculando cada `title` ao seu ícone.

2. **Receber prop `collapsed`** — nova prop booleana controlada pelo `AppLayout`.

3. **Modo expandido (w-64)**: Renderizar ícone + texto lado a lado em cada item. Grupos continuam como acordeões. Sub-menus continuam com chevron + expansão.

4. **Modo mini (w-14)**:
   - Sidebar reduz para `w-14` com `transition-all duration-200`
   - Logo substituída por versão compacta ou escondida
   - Grupos não exibem label nem chevron — cada item é apenas o ícone centralizado
   - Cada ícone envolto em `Tooltip` (do Radix/shadcn já existente) mostrando o título
   - Itens simples: clique navega direto para `item.url`
   - Itens com `subItems`: hover abre `Popover` lateral (ou `DropdownMenu`) com lista de sub-itens
   - Separador visual sutil entre grupos (border-b fino)

### Alterações em `src/components/layout/AppLayout.tsx`

1. **Inicializar `sidebarCollapsed`** a partir de `localStorage('sidebar_collapsed')` em vez de `false`.
2. **Persistir** no `localStorage` ao alternar.
3. **Substituir** o condicional `!sidebarCollapsed && <AppSidebar />` por sempre renderizar `<AppSidebar collapsed={sidebarCollapsed} />` (no desktop).
4. Passar `collapsed` para o sidebar.

### Alterações em `src/components/layout/AppHeader.tsx`

1. **Esconder logo do header** quando sidebar NÃO está colapsada (já funciona assim), manter quando colapsada.

### Mapa de ícones

| Item | Ícone |
|---|---|
| Dashboard Escritório | LayoutDashboard |
| Dashboard Obras | HardHat |
| Relatórios | FileBarChart |
| Leads | Users |
| Documentos | FileText |
| Propostas | FileText |
| Contratos | FileSignature |
| Clientes | UserCheck |
| Obras | Building2 |
| Acompanhamento | ClipboardList |
| Tarefas | CheckSquare |
| Tarefas por Obra | CheckSquare |
| Histórico de Voz | Mic |
| Agenda | CalendarDays |
| Fornecedores | Truck |
| Calendário | CalendarRange |
| Roteiros | Film |
| Publicações | Send |
| Configurações | Settings |
| Usuários | Shield |
| Notas Fiscais | Receipt |

### Arquivos alterados
1. `src/components/layout/AppSidebar.tsx` — ícones + modo mini
2. `src/components/layout/AppLayout.tsx` — persistência localStorage + sempre renderizar sidebar

### O que NÃO muda
- Rotas, páginas, header (exceto lógica de logo já existente)
- Mobile sheet continua igual (sempre expandido)

