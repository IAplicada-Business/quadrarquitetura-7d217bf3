

## Mover Memória de Cálculo para Configurações + Auto-cálculo ao salvar atividade

### 1. CalculationRulesTab — Reorganizar ordem das seções

O arquivo já tem as 3 seções (Regras, Índices, Custos de MO). Reorganizar para:

1. **Índices de Materiais** (mover para o topo, antes das Regras de Cálculo)
   - Melhorar descrição: "Estes índices são usados automaticamente para calcular quantidades de materiais ao cadastrar atividades de obra. São valores globais do escritório — valem para todos os projetos."
   - Trocar campo texto "Tipo de Atividade" por Select com disciplinas: alvenaria, elétrica, hidráulica, pintura, piso, forro, esquadria, marcenaria, limpeza, outros
   - Adicionar coluna "Obs" na tabela
   - Adicionar botão "Importar CSV" com input file que parseia CSV (disciplina, material, unidade, index_per_m2) e faz bulk insert
2. **Custos de Mão de Obra** (mantém como está)
3. **Regras de Cálculo** (desce para o final)

### 2. ProjectMaterialsTab — Remover tab "Memória de Cálculo"

- Remover a tab "calculo" e todo o TabsContent associado (linhas 439-500)
- Remover imports/state de `useMaterialCalc`, `MaterialCalcForm`, `editingCalc`, `calcFormOpen`
- Adicionar link no rodapé da seção de rastreamento: "Para editar os índices de cálculo, acesse Configurações → Regras de Cálculo" com ícone ExternalLink e `<a href="/admin/settings">` (ou `useNavigate`)

### 3. Auto-cálculo ao salvar atividade

No `useProjectActivities.ts`, nos callbacks `onSuccess` de `create` e `update`:
- Chamar uma função async `autoCalculateMaterials(activityData)` que:
  1. Verifica se `area_m2 > 0` e `discipline` está preenchido
  2. Busca `material_indices` onde `activity_type` = discipline (case-insensitive)
  3. Para cada índice: calcula `qty = area_m2 * index_per_m2`
  4. Verifica existência em `material_tracking` (activity_id + material_name)
  5. Se não existe: INSERT com `source='automatico'`, `calculated_quantity=qty`
  6. Se existe e `source='automatico'`: UPDATE `calculated_quantity` e `quantity_needed`
  7. Toast: "X materiais calculados para esta atividade"

O hook `create` retorna `data` (a atividade criada) — usar o `id` dela. Para `update`, já temos o `id` no payload.

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/settings/CalculationRulesTab.tsx` | Reordenar seções (Índices → MO → Regras), select de disciplina, import CSV |
| `src/components/projects/ProjectMaterialsTab.tsx` | Remover tab "calculo", adicionar link para Configurações |
| `src/hooks/useProjectActivities.ts` | Auto-cálculo de materiais no onSuccess de create/update |

Nenhuma migration, rota ou estrutura de tabela alterada.

