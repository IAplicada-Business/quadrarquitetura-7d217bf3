

## Escopo: Agrupamento por Disciplina + Geração de Escopo para Fornecedor

### 1. Migration — Tabela `supplier_scopes`

```sql
CREATE TABLE supplier_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE RESTRICT,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
  discipline text,
  activities jsonb,
  sent_at timestamptz,
  status text DEFAULT 'gerado' CHECK (status IN ('gerado','enviado','orcado','aprovado')),
  quoted_value numeric,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE supplier_scopes ENABLE ROW LEVEL SECURITY;
-- 4 RLS policies padrão de equipe (get_team_user_ids)
```

### 2. Reescrever `ProjectScopeTab.tsx` — Lista sequencial com agrupamento

Substituir o layout Kanban atual por uma lista sequencial ordenada por `position`:

- **Header**: filtro por disciplina (multi-select) + toggle "Agrupar por disciplina" + botões existentes (Gerar com IA, Nova Atividade) + novo botão "Gerar Escopo do Fornecedor"
- **Lista**: cada linha mostra `# | nome | disciplina (badge colorido) | área m² | duração | status badge | predecessora`
- **Drag-and-drop**: handle de grip para reordenar (atualiza `position` via `update.mutate`)
- **Inline actions**: editar (abre ActivityForm) + excluir
- **Modo agrupado**: quando ativo, agrupa por disciplina em seções colapsáveis (Collapsible), mantendo ordem sequencial dentro de cada grupo
- Manter integração com `ActivityForm` e `GenerateActivitiesDialog` existentes

### 3. Novo componente `SupplierScopeDialog.tsx`

Modal "Gerar Escopo do Fornecedor":
1. Select de fornecedor (busca `suppliers` via query inline)
2. Select de disciplina (opções extraídas das atividades do projeto)
3. Preview da lista filtrada: nome da atividade, quantidade/área, observações
4. Botão "Gerar PDF" — client-side com jsPDF: cabeçalho Quadra, nome obra, endereço, fornecedor, tabela de atividades
5. Botão "Enviar por WhatsApp" — `wa.me/{phone}?text={texto formatado}`
6. Botão "Salvar" — insere em `supplier_scopes` via hook

### 4. Hook `useSupplierScopes.ts`

CRUD hook para `supplier_scopes` filtrado por `projectId`. Query com join em `suppliers(name)`.

### 5. Buscar dados do projeto para PDF

No `SupplierScopeDialog`, receber `projectId` e fazer query inline para `projects(name, address, city)` para montar cabeçalho do PDF.

---

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar `supplier_scopes` + RLS |
| `src/components/projects/ProjectScopeTab.tsx` | **Reescrever** — lista sequencial com agrupamento por disciplina |
| `src/components/projects/SupplierScopeDialog.tsx` | **Novo** — modal de geração de escopo + PDF + WhatsApp |
| `src/hooks/useSupplierScopes.ts` | **Novo** — CRUD hook |

Nenhuma outra aba ou rota alterada.

