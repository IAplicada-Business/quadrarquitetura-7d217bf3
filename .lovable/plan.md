

## Pesquisa de Preços em Lote na Aba Cotações

### Contexto

A aba Cotações (`ProjectScenariosTab`) já tem cenários com itens (disciplinas). O `PriceSearchDialog` já faz pesquisa individual via `search-prices-bh`. O hook `usePriceResearch` já tem `getRecentForActivity` com cache de 7 dias. Precisamos buscar as **atividades do projeto** (não os scenario_items) para pesquisar preços em lote.

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/projects/ProjectScenariosTab.tsx` | Botão "Atualizar Preços de BH" + badge + modal de progresso + indicadores visuais por item |
| `src/hooks/usePriceResearch.ts` | Adicionar `searchAllActivities` helper + helper para status de cache |

### 1. `usePriceResearch.ts` — Novos helpers

- **`getPriceStatus(activityId)`**: Retorna `'green'` (< 7d), `'yellow'` (7-30d), `'red'` (> 30d ou sem pesquisa) baseado no `searched_at` mais recente.
- **`getActivitiesNeedingSearch(activities)`**: Filtra atividades sem pesquisa recente (> 7 dias).
- **`getLastUpdateDate()`**: Retorna a data mais recente de `searched_at` de toda a pesquisa do projeto.

### 2. `ProjectScenariosTab.tsx` — Botão + Modal + Indicadores

**Botão no topo** (ao lado de "Analisar Orçamento"):
- "Atualizar Preços de BH" com ícone `RefreshCw`
- Badge: "X atividades sem pesquisa" ou "Atualizado em DD/MM"

**Ao clicar**: busca `project_activities` do projeto. Separa em `precisam_pesquisar` vs `atualizados` (cache 7d). Abre modal de progresso.

**Modal de progresso**:
- Barra de progresso (`Progress` component)
- "Pesquisando preços para X de Y atividades..."
- "Usando cache para Z atividades"
- Loop sequencial com `delay(1000)` entre chamadas à edge function `search-prices-bh`
- Para cada atividade: busca `material_tracking` vinculado como input de materiais; se não houver, usa nome da atividade como material
- Toast final: "Preços atualizados para X atividades. Y já estavam em cache."

**Indicadores visuais nos items do cenário**:
- Ao lado de cada item, ícone colorido (🟢🟡🔴) baseado no status do cache da pesquisa
- Clicável: abre `PriceSearchDialog` para aquela disciplina
- Botão inline "Pesquisar Preços" por item para forçar atualização individual ignorando cache

**Estado adicional**:
```typescript
const [batchSearchOpen, setBatchSearchOpen] = useState(false);
const [batchProgress, setBatchProgress] = useState(0);
const [batchTotal, setBatchTotal] = useState(0);
const [batchCached, setBatchCached] = useState(0);
const [batchSearching, setBatchSearching] = useState(false);
```

### Fluxo do batch search

```text
1. Fetch project_activities para o projectId
2. Fetch all price_research para o projectId (já no hook)
3. Para cada atividade: verificar se tem pesquisa < 7 dias
4. Separar em needsSearch vs cached
5. Modal: "X para pesquisar, Y em cache"
6. Loop sequencial:
   - Buscar material_tracking da atividade para obter lista de materiais
   - Se não houver materiais, usar [{name: activity.name, unit: 'un', quantity: 1}]
   - Chamar search-prices-bh
   - Salvar em price_research
   - Incrementar progresso
   - await delay(1000)
7. Toast final + invalidar queries
```

Nenhuma migration, rota ou edge function alterada.

