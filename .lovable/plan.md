

## Refatorar Fluxo de Materiais — Geração Automática por Atividades

### Migration SQL

```sql
ALTER TABLE material_tracking
  ADD COLUMN IF NOT EXISTS activity_id uuid REFERENCES project_activities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS calculated_quantity numeric,
  ADD COLUMN IF NOT EXISTS adjusted_quantity numeric;

-- Reutilizar coluna 'source' existente (já tem 'manual', 'orcamento', 'indices')
-- Adicionar valor 'automatico' como convention (sem CHECK constraint por ser text livre)
```

Nota: a coluna `source` já existe como `text DEFAULT 'manual'`. Usar `source = 'automatico'` para itens calculados, sem necessidade de CHECK constraint adicional.

### Hook: `useMaterialTracking.ts`

Adicionar mutation `recalculateFromActivities`:
1. Buscar `project_activities` com `area_m2 > 0` para o projeto
2. Buscar todos os `material_indices`
3. Para cada atividade, filtrar índices pela disciplina (case-insensitive match em `activity_type`)
4. Para cada par atividade+índice:
   - Calcular `qty = area_m2 * index_per_m2`
   - Buscar existente em `material_tracking` com `activity_id = atividade.id AND material_name = indice.material_name`
   - Se não existe: INSERT com `source='automatico'`, `calculated_quantity=qty`, `quantity_needed=qty`, `activity_id`
   - Se existe e `source='automatico'`: UPDATE `calculated_quantity` e `quantity_needed`
   - Se existe e `source!='automatico'`: skip (manual override)
5. Retornar contagem para toast

### Aba Materiais: `ProjectMaterialsTab.tsx`

Reestruturar a tab "Rastreamento" em duas seções:

**Seção 1 — "Por Atividade"** (materiais com `activity_id != null`):
- Botão "Recalcular a partir das Atividades" no topo
- Agrupar por `activity_id` — header mostra nome da atividade, disciplina (badge colorido), área m²
- Cada item: nome | unidade | qtd calculada | qtd ajustada (editável inline) | status
- Badge "Ajustado" se `quantity_needed != calculated_quantity`
- Botão inline "Usar calculado" para reverter `quantity_needed = calculated_quantity`

**Seção 2 — "Manuais"** (materiais com `activity_id = null`):
- Tabela como hoje, CRUD simples
- Botão "Novo Material" abre o form existente

Manter as tabs existentes (Rastreamento, Por Atividade do cronograma, Memória de Cálculo, Compras) — a Seção 1/2 substitui o conteúdo da tab "Rastreamento". A tab "Por Atividade" (que mostra materiais do `schedule_tasks`) permanece.

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | `activity_id`, `calculated_quantity`, `adjusted_quantity` em material_tracking |
| `src/hooks/useMaterialTracking.ts` | Adicionar `recalculateFromActivities` mutation |
| `src/components/projects/ProjectMaterialsTab.tsx` | Reestruturar tab Rastreamento em 2 seções (por atividade + manuais) |

Nenhuma rota, hook ou componente adicional necessário. O `MaterialCalcByActivitiesDialog` existente pode ser mantido como alternativa ou removido (redundante com o novo fluxo).

