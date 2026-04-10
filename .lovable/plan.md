

## Plano: Adicionar breadcrumbs em ProjectDetail e LeadDetail

### Alterações

**1. `src/pages/ProjectDetail.tsx`**
- Importar `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` de `@/components/ui/breadcrumb` e `Link` de `react-router-dom`
- Adicionar breadcrumb acima do header existente (dentro do `div.space-y-6`, antes do `div.flex.items-start`):
  - `Gestão de Obras` → link para `/projects`
  - `Obras` → link para `/projects`
  - `[project.name]` → `BreadcrumbPage` (não clicável)
- Estilo: `text-xs text-muted-foreground`, último item `text-primary font-medium`

**2. `src/pages/LeadDetail.tsx`**
- Mesmas importações
- Breadcrumb acima do header:
  - `Comercial` → link para `/leads/pipeline`
  - `Leads` → link para `/leads/pipeline`
  - `[lead.name]` → `BreadcrumbPage`
- Mesmo estilo

### Estilo aplicado
- Font-size 12px (`text-xs`)
- Separador: `ChevronRight` 12px (já default do componente Breadcrumb, ajustar `[&>svg]:size-3`)
- Último item: `text-primary font-medium`

### O que NÃO muda
- Nenhuma rota, nenhum outro componente

