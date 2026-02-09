

# Reestruturacao Completa: Sidebar, Rotas e Paginas Placeholder

## Resumo

Reorganizar o menu lateral (sidebar) para a nova estrutura com 6 grupos (Dashboard, Leads, Clientes, Projetos, Obra, Administrativo), criar as paginas placeholder para os novos modulos (Leads Pipeline, Propostas, Contratos), ajustar as rotas e remover menus antigos que foram absorvidos (Compras, Financeiro, Orcamentos como paginas separadas). Nenhuma logica ou layout existente sera alterado - apenas navegacao, rotas e placeholders novos.

---

## O Que Ja Esta Feito (nao sera tocado)

- Dashboard dividido em Escritorio + Obras
- Status simplificados (7 fases)
- Compras embutidas na aba Orcamentos do projeto
- Pendencias integradas no Cronograma do projeto
- Financeiro renomeado para Prestacao de Contas dentro do projeto

---

## O Que Sera Feito

### 1. Reestruturar o Sidebar

O menu lateral atual tem 6 grupos (Principal, Gestao, Financeiro, Operacional, Arquivos, Sistema). Sera reorganizado para a estrutura final do documento:

```text
Dashboard
  Escritorio (/dashboard/escritorio)
  Obras (/dashboard/obras)

Leads
  Pipeline (/leads/pipeline)
  Propostas (/leads/proposals)
  Contratos (/leads/contracts)

Clientes
  Lista (/clients)

Projetos
  Lista (/projects)

Obra
  Acompanhamento (/construction/tracking)
  Fornecedores (/construction/suppliers)
  Documentos (/construction/documents)
  Relatorios (/construction/reports)

Administrativo
  Configuracoes (/admin/settings)
```

### 2. Criar Paginas Placeholder para Novos Modulos

Criar 3 novas paginas placeholder usando o componente `PlaceholderPage` existente:

- `src/pages/LeadsPipeline.tsx` - Pipeline de Leads com kanban
- `src/pages/LeadsProposals.tsx` - Propostas comerciais
- `src/pages/LeadsContracts.tsx` - Contratos

### 3. Atualizar Rotas no App.tsx

**Adicionar novas rotas:**
- `/leads/pipeline` -> LeadsPipeline
- `/leads/proposals` -> LeadsProposals
- `/leads/contracts` -> LeadsContracts
- `/construction/tracking` -> SiteTracking (reuso da pagina existente)
- `/construction/suppliers` -> Suppliers (reuso)
- `/construction/documents` -> Documents (reuso)
- `/construction/reports` -> Reports (reuso)
- `/admin/settings` -> SettingsPage (reuso)

**Remover rotas que nao sao mais menus separados:**
- `/budgets` - Orcamentos agora e aba do projeto (remover rota)
- `/purchases` - Compras agora esta dentro de Orcamentos do projeto (remover rota)
- `/financial` - Financeiro agora e aba do projeto (remover rota)

**Manter redirecionamentos de compatibilidade:**
- `/site-tracking` -> redirecionar para `/construction/tracking`
- `/suppliers` -> redirecionar para `/construction/suppliers`
- `/documents` -> redirecionar para `/construction/documents`
- `/reports` -> redirecionar para `/construction/reports`
- `/settings` -> redirecionar para `/admin/settings`

### 4. Remover Paginas Obsoletas (Opcional)

As paginas `Budgets.tsx`, `Purchases.tsx` e `Financial.tsx` sao placeholders simples que nao serao mais acessiveis por nenhum menu. Podem ser removidas ou mantidas sem impacto.

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/pages/LeadsPipeline.tsx` (placeholder)
- `src/pages/LeadsProposals.tsx` (placeholder)
- `src/pages/LeadsContracts.tsx` (placeholder)

### Arquivos a modificar:
- `src/components/layout/AppSidebar.tsx` (nova estrutura de menus)
- `src/App.tsx` (novas rotas + redirecionamentos)

### Estrutura do novo sidebar:

O array `menuGroups` sera atualizado para 6 grupos com os itens corretos. Os icones serao aplicados via emoji no label ou via icones Lucide (mantendo o padrao atual que usa apenas texto).

### Paginas placeholder:

Usarao o mesmo padrao de todas as outras paginas placeholder existentes:

```typescript
import { Target } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function LeadsPipeline() {
  return (
    <PlaceholderPage
      title="Pipeline de Leads"
      description="Captacao e funil de leads com kanban"
      icon={Target}
    />
  );
}
```

---

## Resultado Esperado

- Sidebar com 6 grupos organizados por contexto (Dashboard, Leads, Clientes, Projetos, Obra, Administrativo)
- Novas rotas para Leads (Pipeline, Propostas, Contratos) com paginas placeholder
- Rotas antigas redirecionando para os novos caminhos
- Menus de Compras, Orcamentos e Financeiro removidos do sidebar (ja estao dentro das abas do projeto)
- Nenhuma alteracao em logica ou layout de componentes existentes

