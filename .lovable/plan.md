

## Propagação Automática de Datas no Cronograma

### Contexto

O Gantt já tem CPM calculado, setas de dependência e `depends_on` nas atividades. Falta a cascata automática de datas quando uma atividade muda e o feedback visual de impacto.

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/hooks/useProjectActivities.ts` | Adicionar mutation `propagateDates` com lógica de cascata recursiva |
| `src/components/projects/ProjectScheduleTab.tsx` | Botão "Recalcular Cronograma", dialog de confirmação de cascata ao marcar concluída |
| `src/components/projects/GanttChart.tsx` | Highlight de dependentes on hover, botão recalcular no topo |
| `src/components/projects/ActivityForm.tsx` | Ao salvar com data alterada, verificar impacto e exibir modal de preview |
| `src/components/projects/CascadePreviewDialog.tsx` | **Novo** — modal de preview de impacto antes de confirmar |

### 1. Hook: `propagateDates` mutation em `useProjectActivities.ts`

Adicionar função utilitária e mutation:

```typescript
function computeCascade(changedId: string, newEndDate: string, activities: ProjectActivity[]) {
  const changes: { id: string; oldStart: string; oldEnd: string; newStart: string; newEnd: string }[] = [];
  
  function propagate(actId: string, endDate: string) {
    const dependents = activities.filter(a => a.depends_on?.includes(actId));
    for (const dep of dependents) {
      if (!dep.start_date || !dep.end_date) continue;
      const duration = differenceInDays(new Date(dep.end_date), new Date(dep.start_date));
      const newStart = addDays(new Date(endDate), 1).toISOString().split('T')[0];
      const newEnd = addDays(new Date(newStart), duration).toISOString().split('T')[0];
      changes.push({ id: dep.id, oldStart: dep.start_date, oldEnd: dep.end_date, newStart, newEnd });
      propagate(dep.id, newEnd);
    }
  }
  propagate(changedId, newEndDate);
  return changes;
}
```

Mutation `batchUpdateDates`: recebe array de `{ id, start_date, end_date }` e faz updates em loop (Supabase não suporta batch update nativo, mas serão poucas atividades por cascata).

Mutation `recalculateAll`: dado o projeto, pega atividades sem dependências como raiz, percorre em ordem topológica recalculando `start_date = predecessor.end_date + 1`.

### 2. `CascadePreviewDialog.tsx` (novo componente)

Modal que recebe lista de mudanças `{ name, oldStart, oldEnd, newStart, newEnd }[]` e exibe:
- Título: "Esta alteração afeta X atividades"
- Lista: nome — de DD/MM para DD/MM (para cada atividade)
- Botões: "Confirmar recálculo" e "Cancelar"

### 3. `ActivityForm.tsx` — Detectar mudança de data

Ao salvar, se `start_date` ou `end_date` mudou e a atividade tem dependentes:
- Calcular cascata via `computeCascade`
- Se há impacto > 0, abrir `CascadePreviewDialog` em vez de salvar diretamente
- Ao confirmar, salvar atividade + batch update dos dependentes

### 4. `ProjectScheduleTab.tsx`

- Botão "Recalcular Cronograma" ao lado de "Nova Etapa" — chama `recalculateAll`
- Ao marcar atividade como concluída com data diferente: dialog perguntando se deseja recalcular (usando `CascadePreviewDialog`)

### 5. `GanttChart.tsx` — Highlight de dependentes on hover

- State `hoveredTaskId`
- No `onMouseEnter` de cada barra, setar hoveredTaskId
- Função `getDependencyChain(taskId)` que retorna todos os IDs dependentes recursivamente
- Barras na cadeia recebem `outline: 2px solid hsl(var(--primary))` e `opacity: 1` quando hover ativo
- Barras fora da cadeia ficam com `opacity: 0.3`
- No `onMouseLeave`, limpar hover

### Fluxo completo

```text
Usuário edita data da atividade A
  → computeCascade(A.id, A.newEndDate, activities)
  → Se impacto > 0: abre CascadePreviewDialog
    → Lista: B (15/04 → 20/04), C (20/04 → 25/04)
    → "Confirmar recálculo" → batch update B e C
  → Se impacto = 0: salva direto

Usuário clica "Recalcular Cronograma"
  → recalculateAll() reprocessa toda a cadeia
  → Toast: "Cronograma recalculado para X atividades"
```

Nenhuma migration, rota ou estrutura de tabela alterada.

