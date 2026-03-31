

## Três correções pontuais

### 1. Fluxo de Caixa — Lançar receita ao aprovar proposta e criar contrato

**Situação atual**: Ao aprovar proposta em `LeadDetail.tsx` (linha 322-326) e converter em contrato (linha 406-444), nenhum registro é criado na tabela `payments`. O `price_full` da proposta não vira receita.

**Correção**: No `LeadDetail.tsx`, dentro do bloco `onClick` do "Converter em Contrato" (linha 406), após criar o contrato com sucesso, inserir um registro em `payments`:

```typescript
await supabase.from("payments").insert({
  user_id: user.id,
  project_id: null,
  description: `Receita: ${convertProposal.project_name || lead?.name}`,
  value: convertProposal.price_full || 0,
  status: "pendente",
  payment_method: convertProposal.payment_method || null,
  supplier_name: "Receita Escritório",
} as any);
```

Também no `useContracts.ts`, dentro do `signAndCreateProject` (linha 79-114), após criar o projeto, inserir o mesmo tipo de payment vinculado ao `project.id`.

**Nota**: A tabela `payments` não tem coluna `category` nem `project_type`. O campo `description` e `supplier_name` serão usados para identificar a receita como "Receita Escritório". Alternativamente, se quiser distinguir por tipo, seria necessária uma migration para adicionar `category` — mas o pedido diz "sem alterar estrutura existente", então usaremos os campos existentes.

---

### 2. Renomear "Cenários" → "Cotações" (apenas texto da UI)

Arquivos e linhas afetados:

| Arquivo | Alteração |
|---|---|
| `src/pages/ProjectDetail.tsx` (linha 69) | `TabsTrigger` "Cenários" → "Cotações" |
| `src/components/projects/ProjectScenariosTab.tsx` (linhas 161, textos internos) | "Nenhum cenário criado..." → "Nenhuma cotação criada..." e labels similares |
| `src/components/projects/BudgetEstimator.tsx` (linha 77) | `onTabChange?.("cenarios")` — manter o value (é ID da tab, não texto), mas o label "Criar cenário a partir desta estimativa" → "Criar cotação a partir desta estimativa" |

O `value="cenarios"` das tabs **não muda** (é ID interno). Só labels visíveis.

---

### 3. Numeração sequencial de projetos

**3a. Migration**: Criar coluna `project_number` na tabela `projects`:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_number integer;

-- Numerar projetos existentes
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM projects
)
UPDATE projects SET project_number = numbered.rn
FROM numbered WHERE projects.id = numbered.id;
```

**3b. Lógica ao criar projeto** — Em dois locais:

- `src/pages/Projects.tsx` (`createMutation`, linha 63-81): Antes do insert, buscar `MAX(project_number)` e atribuir `max + 1`.
- `src/hooks/useContracts.ts` (`signAndCreateProject`, linha 79-100): Mesmo padrão antes do insert.

Snippet:
```typescript
const { data: maxRow } = await supabase
  .from("projects")
  .select("project_number")
  .order("project_number", { ascending: false })
  .limit(1)
  .single();
const nextNumber = (maxRow?.project_number || 0) + 1;
// adicionar project_number: nextNumber ao insertData
```

**3c. Exibir número na UI**:

- `src/pages/ProjectDetail.tsx` (header, ~linha 55): Exibir badge `#001` ao lado do nome
- `src/pages/Projects.tsx` (tabela, ~linha 222): Prefixar nome com `#001 —`
- `src/pages/LeadsPipeline.tsx`: Se o lead tem `converted_client_id` e projeto vinculado, exibir badge (complexo — skip por agora, pois leads não têm relação direta com projects na query atual)

---

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar `project_number` à tabela `projects` |
| `src/pages/LeadDetail.tsx` | Inserir payment de receita ao criar contrato |
| `src/hooks/useContracts.ts` | Inserir payment de receita + project_number ao assinar contrato |
| `src/pages/Projects.tsx` | Atribuir project_number ao criar + exibir na tabela |
| `src/pages/ProjectDetail.tsx` | Renomear tab "Cenários"→"Cotações" + exibir project_number no header |
| `src/components/projects/ProjectScenariosTab.tsx` | Renomear textos visíveis cenário→cotação |
| `src/components/projects/BudgetEstimator.tsx` | Renomear label do botão |

