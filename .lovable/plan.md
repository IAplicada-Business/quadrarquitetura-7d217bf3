

# Gestao de Obras na Pagina de Acompanhamento

## Contexto

A pagina **Acompanhamento de Obras** (`SiteTracking.tsx`) ja puxa automaticamente projetos com status `mobilizacao` ou `execucao` do banco. Porem, ela e somente leitura -- nao permite criar, editar ou excluir obras.

A pagina **Projetos** (`Projects.tsx`) ja possui toda a logica de CRUD (criar, editar, excluir) com formulario (`ProjectForm`), confirmacao de exclusao, e filtros.

## Solucao

Reutilizar os componentes existentes de CRUD (`ProjectForm`, `AlertDialog`) na pagina de Acompanhamento, adicionando:

1. Botao "Nova Obra" que abre o formulario ja existente com status pre-selecionado como `execucao`
2. Botoes de acao em cada card de obra (editar, excluir, ver detalhes)
3. Texto explicativo de como projetos aparecem nessa tela

---

## Alteracoes

### Arquivo: `src/pages/SiteTracking.tsx`

**Adicionar imports:**
- `useMutation`, `useQueryClient` do tanstack
- `ProjectForm` de `@/components/projects/ProjectForm`
- `AlertDialog` e sub-componentes
- `toast` hook
- `Pencil`, `Trash2`, `Plus`, `Eye` do lucide
- `useNavigate` do react-router-dom

**Adicionar estados:**
- `formOpen` (boolean) - controla abertura do formulario
- `editingProject` (object | null) - projeto em edicao
- `deleteId` (string | null) - id do projeto a excluir

**Adicionar mutations:**
- `createMutation` - cria projeto com status padrao `execucao`
- `updateMutation` - atualiza projeto existente
- `deleteMutation` - exclui projeto

**Modificar UI:**
- Header: adicionar botao "Nova Obra" ao lado do titulo
- Abaixo do header: adicionar texto explicativo: "Projetos em Mobilizacao ou Execucao aparecem automaticamente aqui. Voce tambem pode criar obras diretamente."
- Cards de obras: adicionar botoes de acao (Ver Detalhes, Editar, Excluir) no footer de cada card
- Adicionar `ProjectForm` e `AlertDialog` no final do componente

**Logica do formulario:**
- Ao clicar "Nova Obra": abre formulario com `editingProject = null`, status pre-definido como `execucao`
- Ao clicar editar: abre formulario com dados do projeto pre-preenchidos
- Ao clicar excluir: abre dialogo de confirmacao
- Apos qualquer mutacao: invalida query `active_projects_tracking`

**Botoes de acao nos cards:**
- Substituir o botao unico "Ver Detalhes" por uma linha com 3 botoes: Ver (navega), Editar (abre form), Excluir (abre alerta)

### Nenhum outro arquivo precisa ser modificado
- `ProjectForm` ja existe e aceita `initialData` para edicao
- As queries do banco ja existem com os campos corretos

