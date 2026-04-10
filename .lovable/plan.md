

## Plano: Corrigir numeração Q145+ em project_number

### Resumo
Corrigir a lógica de geração de `project_number` em 3 arquivos para garantir baseline mínimo Q145, e criar migration para atualizar projetos existentes.

### Alterações

**1. `src/hooks/useLeads.ts` (linha 164-168)**
Substituir `}, 0)` por `}, 0)` seguido de `Math.max(maxNum, 144)`:
```ts
const maxNum = (rows ?? []).reduce((max: number, r: any) => {
  const n = parseInt(String(r.project_number ?? "").replace("Q", ""), 10);
  return isNaN(n) ? max : Math.max(max, n);
}, 0);
const nextNumber = `Q${Math.max(maxNum, 144) + 1}`;
```

**2. `src/hooks/useContracts.ts` (linha 86-90)**
Mesma correção:
```ts
const nextNumber = `Q${Math.max(maxNum, 144) + 1}`;
```

**3. `src/pages/Projects.tsx` (linha 67-71)**
Mesma correção na `createMutation`:
```ts
const nextNumber = `Q${Math.max(maxNum, 144) + 1}`;
```

**4. Migration SQL**
Atualizar projetos existentes com numeração abaixo de Q145:
```sql
UPDATE projects
SET project_number = 'Q' || (
  ROW_NUMBER() OVER (ORDER BY created_at) + 144
)::text
WHERE project_number IS NULL
   OR (project_number LIKE 'Q%'
       AND (REPLACE(project_number, 'Q', ''))::integer < 145);
```

**5. Exibição** — Já implementado:
- `ProjectDetail.tsx` já mostra `project_number` como Badge no header
- `Projects.tsx` já mostra `project_number` na listagem de obras

### O que NÃO muda
- Nenhuma outra lógica de criação de projeto
- Nenhum componente de página além das 3 linhas de numeração

