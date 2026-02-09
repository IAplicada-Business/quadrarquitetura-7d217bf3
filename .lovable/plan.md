

# Configuracoes Full-Width + Gestao de Usuarios e Permissoes

## Parte 1: Cards ocupando espaco completo da pagina

**Arquivo:** `src/pages/SettingsPage.tsx`

Remover a restricao `max-w-2xl` do container dos cards para que ocupem toda a largura disponivel. Organizar os cards em grid responsivo (2 colunas em desktop).

---

## Parte 2: Submenu "Usuarios" em Administrativo

### Sidebar

**Arquivo:** `src/components/layout/AppSidebar.tsx`

Adicionar `{ title: "Usuarios", url: "/admin/users" }` no grupo "Administrativo".

### Migracao de Banco

Criar tabela `user_permissions` para controle granular de acesso por pagina/aba:

```sql
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,        -- ex: 'leads_pipeline', 'projects', 'admin_users'
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, page_key)
);

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
-- Apenas admins podem ler/gerenciar permissoes
```

### Nova pagina

**Arquivo:** `src/pages/AdminUsersPage.tsx` (novo)

Pagina com duas secoes:

**Secao 1 - Lista de Usuarios**
- Tabela com: Nome, E-mail, Funcao (admin/moderator/user), Data de criacao
- Botao "Criar Usuario" que abre dialog com form (nome, e-mail, senha, funcao)
- Criacao de usuario via edge function (usa `supabase.auth.admin.createUser`)
- Botao para alterar funcao de cada usuario
- Botao para desativar usuario

**Secao 2 - Permissoes por Usuario**
- Selecionar usuario na lista acima
- Grid de checkboxes mostrando todas as paginas/abas do sistema
- Colunas: Pagina, Visualizar, Editar
- Paginas organizadas por grupo (Dashboard, Leads, Clientes, Projetos, Obra, Administrativo)
- Salvar permissoes na tabela `user_permissions`
- Admins tem acesso total automaticamente (nao precisa configurar)

### Edge Function para criacao de usuarios

**Arquivo:** `supabase/functions/create-user/index.ts` (novo)

- Recebe: email, password, full_name, role
- Valida que o chamador e admin (verifica `has_role`)
- Cria usuario via `supabase.auth.admin.createUser`
- Insere role na tabela `user_roles`
- Retorna dados do usuario criado

### Rota

**Arquivo:** `src/App.tsx`

Adicionar rota `/admin/users` apontando para `AdminUsersPage`.

---

## Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| Migracao SQL | Criar tabela `user_permissions` + RLS |
| `src/pages/SettingsPage.tsx` | Editar - remover max-w-2xl, grid responsivo |
| `src/components/layout/AppSidebar.tsx` | Editar - adicionar link Usuarios |
| `src/pages/AdminUsersPage.tsx` | Novo - gestao de usuarios e permissoes |
| `supabase/functions/create-user/index.ts` | Novo - edge function para criar usuarios |
| `src/App.tsx` | Editar - adicionar rota /admin/users |

---

## Detalhes Tecnicos

### Mapeamento de paginas para permissoes

```text
dashboard_escritorio    Dashboard > Escritorio
dashboard_obras         Dashboard > Obras
leads_pipeline          Leads > Pipeline
leads_proposals         Leads > Propostas
leads_contracts         Leads > Contratos
clients                 Clientes > Lista
projects                Projetos > Lista
construction_tracking   Obra > Acompanhamento
construction_tasks      Obra > Tarefas
construction_suppliers  Obra > Fornecedores
construction_documents  Obra > Documentos
construction_reports    Obra > Relatorios
admin_settings          Administrativo > Configuracoes
admin_users             Administrativo > Usuarios
```

### Logica de acesso
- Admins: acesso total, sem restricao
- Outros: verificar `user_permissions` para cada pagina
- Se nao houver registro de permissao, acesso negado por padrao
- A verificacao e feita no frontend (hook `useUserPermissions`) com fallback no backend via RLS

