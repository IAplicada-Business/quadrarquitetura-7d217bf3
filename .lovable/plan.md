

## Importação de Dados da Proposta na Aba Cotações

### Migration SQL

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cotacao_importada boolean DEFAULT false;
```

### Alteração em `src/hooks/useContracts.ts`

No `signAndCreateProject` (linha 93-108), adicionar `source_proposal_id` ao insert do projeto. O contrato tem `proposal_id` — usar esse valor:

```typescript
source_proposal_id: contract.proposal_id,
```

### Alteração em `src/components/projects/ProjectScenariosTab.tsx`

Adicionar lógica no topo do componente:

1. Buscar `project.source_proposal_id` e `project.cotacao_importada` via `useProjectDetail` (já importado)
2. Se `source_proposal_id` preenchido e `cotacao_importada` falso e `scenarios.length === 0`: exibir banner com "Importar da Proposta" / "Começar do Zero"
3. Se `source_proposal_id` preenchido e `cotacao_importada` true: exibir referência no topo (valor contratado + condições)

**Banner de importação**: Card com ícone, texto explicativo e dois botões.

**Ao clicar "Importar da Proposta"**:
- Buscar proposta pelo `source_proposal_id` (query inline com `supabase.from("proposals").select("*").eq("id", id).single()`)
- Criar um cenário automático com nome "Proposta Aprovada"
- Para cada item em `proposals.ambientes` (jsonb array): criar `scenario_item` com discipline = ambiente
- Atualizar `projects.estimated_budget` com `proposals.price_full`
- Atualizar `projects.total_area` com `proposals.total_area`
- Marcar `projects.cotacao_importada = true`

**Ao clicar "Começar do Zero"**:
- Apenas marcar `projects.cotacao_importada = true` (fecha o banner permanentemente)

**Referência no topo** (quando `source_proposal_id` presente):
- Query para buscar proposta aprovada
- Exibir card compacto: "Valor contratado: R$ X" | "Parcelas: Xx R$ Y" | "Escopo: [descrição]"

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | `source_proposal_id` + `cotacao_importada` em projects |
| `src/hooks/useContracts.ts` | Preencher `source_proposal_id` no insert do projeto |
| `src/components/projects/ProjectScenariosTab.tsx` | Banner de importação + referência de valor contratado |

Nenhuma outra aba, rota ou hook alterado.

