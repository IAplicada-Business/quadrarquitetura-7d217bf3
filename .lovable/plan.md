

## Módulo de Notas Fiscais — Duas visões

### 1. Migration — Tabela `invoices_nf` + Storage bucket

```sql
CREATE TABLE invoices_nf (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  nf_number text,
  nf_type text CHECK (nf_type IN ('emitida','recebida')),
  issuer_name text,
  issuer_cnpj text,
  recipient_name text,
  recipient_cnpj text,
  service_description text,
  amount numeric NOT NULL,
  issue_date date NOT NULL,
  competence_month text,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente','enviada_contador','arquivada')),
  sent_to_accountant_at timestamptz,
  file_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE invoices_nf ENABLE ROW LEVEL SECURITY;
-- 4 RLS policies padrão de equipe (get_team_user_ids)
-- Bucket 'invoices' público para upload de XML/PDF
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);
-- Storage RLS: authenticated can upload/read
```

### 2. Hook `useInvoicesNF`

CRUD hook com filtros opcionais: `projectId`, `nfType`, `competenceMonth`, `status`. Query retorna dados ordenados por `issue_date DESC`.

### 3. Componente `InvoiceNFForm`

Dialog com campos: nf_number, nf_type (select emitida/recebida), issuer_name, issuer_cnpj, recipient_name, recipient_cnpj, service_description, amount, issue_date, competence_month (YYYY-MM), status, notes, file upload (XML/PDF para bucket `invoices`).

### 4. Componente `InvoiceNFList`

Tabela reutilizável com filtros (projeto, tipo, mês competência, status). Colunas: Nº NF, Tipo (badge), Emitente, Valor, Data Emissão, Competência, Status, Ações. Botões por linha: editar, "Enviar ao Contador" (muda status + set `sent_to_accountant_at`), excluir.

### 5. Integração na aba "Prestação de Contas"

Em `ProjectFinancialTab.tsx`, adicionar terceira sub-aba **"Notas Fiscais"** dentro do `Tabs` existente (ao lado de Pagamentos e Notas Fiscais antigas). Renderiza `InvoiceNFList` filtrado por `projectId`.

### 6. Página administrativa `/admin/invoices`

Nova página `InvoicesPage.tsx` com visão consolidada (sem filtro de projeto fixo). Inclui:
- Filtros globais: projeto (select), tipo, mês, status
- Tabela completa com coluna "Projeto"
- Botão "Exportar Relatório Mensal" — gera CSV client-side com separação emitidas/recebidas e totais

### 7. Rota + Sidebar

- `App.tsx`: adicionar `<Route path="/admin/invoices" element={<InvoicesPage />} />`
- `AppSidebar.tsx`: no grupo "Administrativo", adicionar `{ title: "Notas Fiscais", url: "/admin/invoices" }`

### 8. KPI no Dashboard Escritório

Em `DashboardEscritorio.tsx`, adicionar query para `invoices_nf` com `status = 'pendente'` e exibir card **"NFs pendentes de envio"** com contagem e link para `/admin/invoices?status=pendente`.

---

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar `invoices_nf` + RLS + bucket `invoices` + storage policies |
| `src/hooks/useInvoicesNF.ts` | **Novo** — CRUD + filtros |
| `src/components/projects/InvoiceNFForm.tsx` | **Novo** — Formulário com upload |
| `src/components/projects/InvoiceNFList.tsx` | **Novo** — Tabela filtrada reutilizável |
| `src/components/projects/ProjectFinancialTab.tsx` | Adicionar sub-aba "Notas Fiscais" |
| `src/pages/InvoicesPage.tsx` | **Novo** — Visão administrativa consolidada |
| `src/App.tsx` | Adicionar rota `/admin/invoices` |
| `src/components/layout/AppSidebar.tsx` | Adicionar item no menu Administrativo |
| `src/pages/DashboardEscritorio.tsx` | Adicionar KPI "NFs pendentes" |

Nenhuma rota ou funcionalidade existente alterada.

