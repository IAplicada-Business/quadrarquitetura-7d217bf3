

## Campos adicionais no módulo de Contratos

### 1. Migration — Novas colunas em `contracts`

```sql
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_address text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS project_address text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS environments text;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS total_area numeric;
```

Nota: `client_address` já existe no formulário como campo local, mas precisa ser persistido na tabela. `project_address` é novo (endereço da obra separado do campo `address` existente — ou reutilizar `address` como `project_address`). Verificando o schema atual: a tabela já tem `address` e `city` para obra. Vou adicionar apenas as colunas que realmente faltam.

---

### 2. Auto-preenchimento na conversão proposta → contrato

**Em `LeadDetail.tsx`** (linhas 413-428): Ao criar contrato a partir de proposta aprovada, adicionar:
- `environments`: converter `proposal.ambientes` (jsonb array) em texto formatado (join com vírgula)
- `total_area`: copiar de `proposal.total_area`
- `client_address`: buscar do cliente convertido (se existir `lead.converted_client_id`, buscar `clients.address`)

**Em `LeadsContracts.tsx`** → `handleSelectProposal` (linhas 88-105): Ao selecionar proposta no formulário, preencher também:
- `environments` e `total_area` vindos da proposta
- `client_address` se disponível via lead/client

---

### 3. Formulário de contrato — Novos campos

Em `LeadsContracts.tsx`, adicionar ao `formData`:
- `environments` (textarea, seção "Dados da Obra")
- `total_area` (input number, seção "Dados da Obra")

Esses campos já são editáveis e salvos via `handleSubmit`.

---

### 4. Variáveis no ContractPreview

Em `ContractPreview.tsx`, adicionar novas props e variáveis de interpolação:
- `environments` → `{AMBIENTES}`
- `totalArea` → `{METRAGEM}`
- `clientAddress` já existe como `{ENDERECO_CLIENTE}`
- `constructionAddress` já existe como `{ENDERECO_OBRA}`

Adicionar ao objeto `vars` as novas variáveis para que templates possam usar `{AMBIENTES}` e `{METRAGEM}`.

---

### 5. useContracts — Persistir novos campos

Em `useContracts.ts`, no `signAndCreateProject`, garantir que `environments` e `total_area` são copiados ao payload.

---

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | `ALTER TABLE contracts ADD COLUMN environments text, total_area numeric` (client_address e project_address — verificar se `address` já cobre) |
| `src/pages/LeadDetail.tsx` | Adicionar `environments`, `total_area` ao insert do contrato |
| `src/pages/LeadsContracts.tsx` | Novos campos no formData + formulário + handleSelectProposal |
| `src/components/leads/ContractPreview.tsx` | Novas props + variáveis `{AMBIENTES}`, `{METRAGEM}` |

