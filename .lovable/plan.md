

## Plano: Refatoração do Menu Lateral

### Resumo
Reescrever `menuGroups` em `AppSidebar.tsx` com a nova estrutura de 4 grupos, atualizar o `routeGroupMap` para auto-expand correto, mudar a chave do localStorage para `sidebar_groups_state`, e adicionar 3 rotas placeholder para Gestão de Conteúdo em `App.tsx`.

### Arquivos alterados

**1. `src/components/layout/AppSidebar.tsx`**
- Substituir `menuGroups` pela nova estrutura:
  - **Comercial**: Leads (`/leads/pipeline`), Documentos (expansível: Propostas `/leads/proposals`, Contratos `/leads/contracts`), Clientes (`/clients`)
  - **Gestão de Obras**: Obras (`/projects`), Acompanhamento (`/construction/tracking`), Tarefas (expansível: Tarefas por Obra, Histórico de Voz, Agenda), Fornecedores (`/construction/suppliers`)
  - **Gestão de Conteúdo**: Calendário (`/content/calendar`), Roteiros (`/content/scripts`), Publicações (`/content/posts`)
  - **Administrativo**: Dashboard Escritório (`/dashboard/escritorio`), Dashboard Obras (`/dashboard/obras`), Configurações, Usuários, Notas Fiscais, Relatórios
- Atualizar `routeGroupMap`:
  - `/leads` → Comercial
  - `/clients` → Comercial
  - `/projects` → Gestão de Obras
  - `/construction` → Gestão de Obras
  - `/content` → Gestão de Conteúdo
  - `/dashboard` → Administrativo
  - `/admin` → Administrativo
- Mudar chave localStorage de `sidebar_groups` para `sidebar_groups_state`

**2. `src/App.tsx`**
- Adicionar 3 rotas dentro do layout protegido:
  - `/content/calendar` → placeholder
  - `/content/scripts` → placeholder
  - `/content/posts` → placeholder
- Criar componente placeholder inline ou importar `PlaceholderPage`

**3. `src/pages/ContentPlaceholder.tsx`** (novo)
- Componente simples reutilizável que recebe `title` e renderiza mensagem "Em breve"

### O que NÃO muda
- Nenhuma rota existente removida ou alterada
- Nenhum componente de página modificado
- Rota `/construction/documents` permanece funcional (apenas removida do menu, não da rota)

