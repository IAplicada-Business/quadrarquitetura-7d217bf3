

## 3 Correções Críticas

### Correção 1: Numeração Q-prefixed de projetos

**Migration SQL:**
- Alterar `project_number` de `integer` para `text` para suportar formato "Q148"
- Retroativamente atribuir Q1, Q2... em ordem de `created_at` para projetos sem numeração Q

```sql
ALTER TABLE projects ALTER COLUMN project_number TYPE text USING 
  CASE WHEN project_number IS NOT NULL THEN 'Q' || project_number::text ELSE NULL END;
```

**Lógica de próximo número** (3 locais):
- `src/pages/Projects.tsx` (createMutation, linha 66-72)
- `src/hooks/useContracts.ts` (signAndCreateProject, linha 84-91)
- Novo fluxo de conversão lead→projeto (Correção 3)

Em cada local, substituir a query de max integer por:
```typescript
const { data: rows } = await supabase.from("projects").select("project_number");
const maxNum = (rows ?? []).reduce((max, r) => {
  const n = parseInt(String(r.project_number ?? "").replace("Q", ""), 10);
  return isNaN(n) ? max : Math.max(max, n);
}, 0);
const nextNumber = `Q${maxNum + 1}`;
```

**Exibição** — substituir `#{padStart(3,"0")}` por exibir diretamente o valor (ex: "Q148"):
- `src/pages/Projects.tsx` linha 233-235
- `src/pages/ProjectDetail.tsx` linha 53-56

---

### Correção 2: Separar caixa escritório vs obra

**Migration:**
```sql
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source text 
  DEFAULT 'obra' CHECK (source IN ('escritorio','obra'));
```

**useContracts.ts** (linha 125-132) — no insert de payment de receita:
- Adicionar `source: 'escritorio'`
- Mudar description para `Honorários — ${lead?.name || "Projeto"}`

**DashboardEscritorio.tsx** — na query de payments, filtrar `source = 'escritorio'` (ou incluir todos e filtrar no computed):
- `receitaDespesaData` e KPIs financeiros: filtrar por `source === 'escritorio'`

**DashboardObras.tsx** — filtrar payments por `source === 'obra'` (ou `source !== 'escritorio'`)

---

### Correção 3: Conversão automática lead→projeto

**useLeads.ts** — expandir `convertToClient` (linha 114-140):
1. Antes de inserir cliente, verificar duplicata por email/telefone em `clients`
2. Após criar/encontrar cliente, buscar proposta aprovada do lead
3. Gerar próximo `project_number` (Q-prefixed)
4. Criar projeto com `name: lead.name + ' — ' + project_type`, `status: 'planejamento'`, `project_number`
5. Toast com botão "Ir para o projeto" usando `navigate`

**Orphaned leads** — em `src/pages/Projects.tsx`:
- Ao carregar, query leads com `status = 'fechado'` e `converted_client_id IS NOT NULL` mas sem projeto vinculado
- Para cada um, criar projeto retroativamente (mesma lógica)

---

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | `project_number` para text + coluna `source` em payments |
| `src/pages/Projects.tsx` | Numeração Q-prefixed + display + orphan check |
| `src/pages/ProjectDetail.tsx` | Display Q-prefixed |
| `src/hooks/useContracts.ts` | Numeração Q + `source: 'escritorio'` no payment |
| `src/hooks/useLeads.ts` | Conversão completa lead→cliente→projeto |
| `src/pages/DashboardEscritorio.tsx` | Filtrar payments por source escritorio |
| `src/pages/DashboardObras.tsx` | Filtrar payments por source obra |

