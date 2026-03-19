

## ALTERAÇÃO 5 — Materiais dentro da atividade

### Resumo
Adicionar campo `status` a cada material associado na atividade (Necessário, Comprado, Entregue, Usado) e espelhar esses materiais na aba de Materiais do projeto, agrupados por atividade de origem.

---

### 1. Atualizar `ConstructionTaskForm.tsx` — Status no material

**Expandir `MaterialItem`** para incluir `status`:
```typescript
interface MaterialItem {
  name: string;
  quantity: number | string;
  unit: string;
  status: string; // "necessario" | "comprado" | "entregue" | "usado"
}
```

**No formulário de materiais** (linhas 369-386):
- Adicionar um Select de status ao lado de cada material com as 4 opções
- Default: "necessario" ao adicionar novo material
- Layout: Nome (flex-1) | Qtd (w-20) | Un (w-20) | Status (w-28) | Lixeira

### 2. Atualizar `ProjectMaterialsTab.tsx` — Espelhar materiais das atividades

**Adicionar query** para buscar `schedule_tasks` do projeto que tenham `materials` (jsonb) não vazio.

**Nova sub-aba ou seção** "Por Atividade" na aba de Materiais:
- Agrupar materiais por atividade de origem (nome da task)
- Cada grupo mostra: nome da atividade como header, lista de materiais com nome, qtd, unidade, status
- Status exibido como Badge colorido
- Dados são read-only nesta visão (edição é feita na atividade)

### Detalhes técnicos

- O campo `materials` já é `jsonb` na tabela `schedule_tasks` — nenhuma migração necessária
- A interface `MaterialItem` no form já existe, apenas adicionar o campo `status`
- Na ProjectMaterialsTab, usar query direta: `supabase.from("schedule_tasks").select("id, task_name, materials, discipline, environment").eq("project_id", projectId).not("materials", "is", null)`
- Filtrar no JS: `materials?.length > 0`
- Arquivos editados: `ConstructionTaskForm.tsx`, `ProjectMaterialsTab.tsx`

