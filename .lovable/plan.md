

## Plano: Padronizar padding e espaçamento das páginas

### Padrão a aplicar

Wrapper: `className="space-y-6 p-0"`
Header: `<div className="flex items-center justify-between">` com `<h1 className="text-2xl font-playfair">` e `<p className="text-sm text-muted-foreground mt-1">`
Cards: `p-6` consistente. Gaps: `gap-6`.

### Alterações por arquivo

**1. `src/pages/Clients.tsx`**
- Wrapper `<div>` → `<div className="space-y-6 p-0">`
- Header: trocar `flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6` → `flex items-center justify-between`
- `h1`: trocar `font-bold font-display mb-1` → `font-playfair`
- `p`: adicionar `text-sm` e `mt-1`, remover wrapping extra

**2. `src/pages/Suppliers.tsx`**
- Wrapper: `space-y-6 animate-fade-in` → `space-y-6 p-0 animate-fade-in`
- Header: `flex justify-between items-center` → `flex items-center justify-between`
- `h1`: `font-bold text-display` → `font-playfair`
- `p`: adicionar `text-sm mt-1`
- Remover `mb-6` do div de filtros (já coberto pelo `space-y-6`)
- Grid de cards: `gap-4` → `gap-6`

**3. `src/pages/InvoicesPage.tsx`**
- Wrapper: já tem `space-y-6`, adicionar `p-0`
- `h1`: `font-bold font-display` → `font-playfair`
- `p`: adicionar `text-sm mt-1`

**4. `src/pages/Reports.tsx`**
- Wrapper: adicionar `p-0`
- `h1`: `font-bold` → `font-playfair`
- `p`: adicionar `text-sm mt-1`

**5. `src/pages/ContentPlaceholder.tsx`**
- Wrapper `<div>` → `<div className="space-y-6 p-0">`
- Header: wrapping `<div className="flex items-center justify-between">`
- `h1`: `font-bold font-display mb-1` → `font-playfair`
- `p`: `mb-8` → `text-sm mt-1`, remover `mb-8`

### Arquivos alterados
1. `src/pages/Clients.tsx`
2. `src/pages/Suppliers.tsx`
3. `src/pages/InvoicesPage.tsx`
4. `src/pages/Reports.tsx`
5. `src/pages/ContentPlaceholder.tsx`

### O que NÃO muda
- Lógica, rotas, conteúdo, componentes internos

