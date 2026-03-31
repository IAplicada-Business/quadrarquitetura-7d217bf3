

## Reestruturação do menu lateral

### Alteração no `menuGroups` em `src/components/layout/AppSidebar.tsx`

Remover o grupo **"Obra"** e redistribuir seus itens:

**Grupo "Projetos"** — nova estrutura:
- **Obras** (url: `/projects`) — renomeado de "Lista"
- **Acompanhamento** (url: `/construction/tracking`)
- **Tarefas** (submenu com: Tarefas por Obra, Histórico de Voz, Agenda) — mantém estrutura atual
- **Fornecedores** (url: `/construction/suppliers`)
- **Documentos** (url: `/construction/documents`)

**Grupo "Administrativo"** — adicionar:
- **Relatórios** (url: `/construction/reports`) — movido de "Obra"

Resultado final dos grupos:
1. Dashboard (Escritório, Obras)
2. Leads (Pipeline, Propostas, Contratos)
3. Clientes (Lista)
4. **Projetos** (Obras, Acompanhamento, Tarefas▸, Fornecedores, Documentos)
5. **Administrativo** (Configurações, Usuários, **Relatórios**)

### Arquivo alterado

| Arquivo | Alteração |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Atualizar `menuGroups` — remover grupo "Obra", mover itens para "Projetos" e "Administrativo" |

Nenhuma rota alterada — apenas reorganização do menu.

