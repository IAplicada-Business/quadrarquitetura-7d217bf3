

## Cálculo Automático de Materiais por Índices de Atividade

### 1. Migration — Criar tabela `material_indices`

```sql
CREATE TABLE material_indices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL,
  material_name text NOT NULL,
  unit text NOT NULL,
  index_per_m2 numeric NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE material_indices ENABLE ROW LEVEL SECURITY;

-- Equipe pode visualizar
CREATE POLICY "Team can view material_indices" ON material_indices
  FOR SELECT TO authenticated USING (true);

-- Admin pode CRUD
CREATE POLICY "Admin can insert material_indices" ON material_indices
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update material_indices" ON material_indices
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can delete material_indices" ON material_indices
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
```

Seed dos índices base via migration (INSERT dos 9 registros fornecidos).

---

### 2. Hook `src/hooks/useMaterialIndices.ts`

CRUD hook para `material_indices`. Query sem filtro (tabela global). Mutations de create/update/delete para admin.

---

### 3. Aba Materiais — Botão "Calcular por Atividades"

Em `ProjectMaterialsTab.tsx`, na sub-aba "Rastreamento":

- Adicionar botão **"Calcular por Atividades"** ao lado dos botões existentes
- Ao clicar, abre um Dialog que:
  1. Busca `project_activities` com `area_m2 > 0`
  2. Cruza `activity.discipline` (lowercase) com `material_indices.activity_type`
  3. Calcula `quantidade = area_m2 × index_per_m2`
  4. Exibe tabela com: material, unidade, quantidade calculada, quantidade ajustada (Input editável), checkbox de seleção
- Botão **"Importar para Lista"** insere os selecionados em `material_tracking` com `source: 'indices'`, verificando duplicatas por `material_name` + `project_id`

---

### 4. Configurações → Regras de Cálculo — Seção "Índices de Material"

Em `CalculationRulesTab.tsx`, adicionar seção abaixo das regras existentes:

- Título: "Índices de Material por m²"
- Tabela com colunas: Tipo de Atividade, Material, Unidade, Índice/m²
- Botões de adicionar/editar/remover (somente admin)
- Dialog de formulário com campos: activity_type (input texto), material_name, unit (select), index_per_m2 (number), notes

---

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar tabela + RLS + seed |
| `src/hooks/useMaterialIndices.ts` | **Novo** — CRUD hook |
| `src/components/projects/ProjectMaterialsTab.tsx` | Adicionar botão + dialog de cálculo |
| `src/components/settings/CalculationRulesTab.tsx` | Adicionar seção de índices |

Nenhuma alteração em `material_tracking`, `useProjectActivities`, ou outras abas.

