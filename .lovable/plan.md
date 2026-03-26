

## Adicionar seção "Ambientes" no formulário e no PDF

### Contexto

Não existe tabela `pipeline_rooms` no banco. Os ambientes serão inseridos manualmente via campo de texto livre (um por linha). A tabela `proposals` já tem campos flexíveis — precisamos adicionar `ambientes` (jsonb array) e `total_area` (numeric) via migration.

### Edições

**1. Migration — adicionar colunas na tabela `proposals`**
```sql
ALTER TABLE public.proposals ADD COLUMN ambientes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.proposals ADD COLUMN total_area numeric;
```

**2. `src/components/leads/ProposalFormNew.tsx`**
- Adicionar `ambientes: string[]` e `total_area: number | null` ao `ProposalFormData`
- Nova seção "4. Ambientes" entre Escopo (seção 2) e Prazos (seção 3, que vira 5)
- Renumerar seções: 3→Ambientes, 4→Prazos, 5→Valores, 6→Portfólio
- Campo: `<Textarea>` com placeholder "Digite os ambientes, um por linha" — ao salvar, faz `.split("\n").filter(Boolean)`
- Campo: `<Input type="number">` para "Metragem total (m²)"

**3. `src/components/leads/proposal-pages/shared.tsx`**
- Adicionar `ambientes?: string[]` e `totalArea?: number | null` ao `ProposalPageProps`

**4. `src/components/leads/proposal-pages/ScopeFlowPage.tsx`**
- Após o parágrafo de escopo e antes do fluxo de steps, renderizar:
  - Label "Ambientes contemplados:" em negrito (cor vinho)
  - Lista simples dos ambientes separados por vírgula ou bullet
  - Se `totalArea`, mostrar "Metragem total: X m²"

**5. `src/pages/LeadsProposals.tsx`** (ou onde `onSave` persiste)
- Passar `ambientes` e `total_area` no insert/update do Supabase

Nenhuma rota ou aba será alterada.

