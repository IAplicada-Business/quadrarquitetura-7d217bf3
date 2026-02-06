
# Menu Lateral com Sub-abas Fechadas + Header Superior Responsivo

## Alteracoes

### 1. Sidebar -- Sub-abas fechadas por padrao (`AppSidebar.tsx`)

Atualmente, o estado inicial dos grupos e `true` (todos abertos):
```text
Object.fromEntries(menuGroups.map((g) => [g.label, true]))
```

Mudar para `false` para todos os grupos iniciarem fechados:
```text
Object.fromEntries(menuGroups.map((g) => [g.label, false]))
```

### 2. Novo componente: Header superior (`AppHeader.tsx`)

Criar `src/components/layout/AppHeader.tsx` com:

- Barra horizontal fixa no topo da area de conteudo (nao sobrepoe o sidebar)
- **Lado esquerdo**: titulo da pagina atual (opcional, pode ser omitido para manter discreto)
- **Lado direito** (agrupados, discretos):
  - Icone de sino (notificacoes) com badge numerico discreto -- por enquanto apenas visual, sem funcionalidade backend
  - Dropdown do usuario contendo:
    - Avatar circular com iniciais do nome (extraido de `user.user_metadata.full_name` ou primeira letra do email)
    - Ao clicar, abre um `DropdownMenu` com:
      - Nome do usuario e email (informativo)
      - Link "Perfil" que navega para `/settings`
      - Botao "Sair" que chama `signOut()`

**Design discreto:**
- Fundo branco/transparente com borda inferior sutil (`border-b`)
- Altura compacta (`h-14`)
- Elementos alinhados a direita com `gap-2`
- Avatar pequeno (`h-8 w-8`) com fundo `primary` e texto branco
- Icone de notificacao em tom `muted-foreground`
- Dropdown com fundo opaco (`bg-popover`) e z-index alto

### 3. Layout -- Integrar Header (`AppLayout.tsx`)

Alterar o layout para incluir o header acima do conteudo:

```text
<div className="flex h-screen w-full overflow-hidden">
  <AppSidebar />
  <div className="flex-1 flex flex-col overflow-hidden">
    <AppHeader />                          <-- NOVO
    <main className="flex-1 overflow-y-auto">
      <div className="p-6 lg:p-8 animate-fade-in">
        <Outlet />
      </div>
    </main>
  </div>
</div>
```

### 4. Mobile -- Sidebar com Sheet + Hamburger no Header

Para telas menores que 768px (usando `useIsMobile()`):
- O sidebar fica oculto por padrao
- O header mostra um botao hamburger (icone `Menu`) no lado esquerdo
- Ao clicar, abre o sidebar dentro de um `Sheet` (slide da esquerda)
- O Sheet fecha ao clicar em qualquer link de navegacao

### 5. Remover botao "Sair" do rodape do sidebar

Com o logout agora acessivel pelo dropdown do usuario no header, o botao "Sair" no rodape do sidebar pode ser removido para simplificar a interface. Manter apenas o botao de colapsar/expandir.

---

## Arquivos Afetados

| Arquivo | Acao |
|---------|------|
| `src/components/layout/AppHeader.tsx` | NOVO -- Header superior com avatar, notificacoes e dropdown |
| `src/components/layout/AppLayout.tsx` | EDITAR -- Integrar AppHeader + layout responsivo com Sheet para mobile |
| `src/components/layout/AppSidebar.tsx` | EDITAR -- Grupos fechados por padrao + remover botao Sair do rodape |

### Componentes utilizados (ja existem no projeto)
- `DropdownMenu` de `@radix-ui/react-dropdown-menu`
- `Sheet` de `@radix-ui/react-dialog` (ja configurado em `sheet.tsx`)
- `Avatar` de `@radix-ui/react-avatar`
- `useIsMobile()` de `src/hooks/use-mobile.tsx`
- `useAuth()` de `src/contexts/AuthContext.tsx`
