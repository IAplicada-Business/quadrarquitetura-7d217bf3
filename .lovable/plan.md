

## Gerar Prévia de Orçamento — Aba Cotações

### 1. Migration — Tabela `labor_costs`

```sql
CREATE TABLE labor_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discipline text NOT NULL,
  activity_type text,
  cost_per_m2 numeric,
  cost_per_unit numeric,
  unit text DEFAULT 'm2',
  region text DEFAULT 'Belo Horizonte',
  notes text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE labor_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view labor_costs" ON labor_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert labor_costs" ON labor_costs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update labor_costs" ON labor_costs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can delete labor_costs" ON labor_costs FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
```

Seed com valores iniciais:
```sql
INSERT INTO labor_costs (discipline, activity_type, cost_per_m2, unit) VALUES
('Elétrica', 'eletrica', 45, 'm2'),
('Pintura', 'pintura', 18, 'm2'),
('Alvenaria', 'alvenaria', 55, 'm2'),
('Piso', 'piso', 35, 'm2'),
('Reboco', 'reboco', 30, 'm2'),
('Hidráulica', 'hidraulica', 50, 'm2'),
('Gesso/Forro', 'gesso', 40, 'm2');
```

---

### 2. Hook `src/hooks/useLaborCosts.ts`

CRUD hook para `labor_costs`. Mesma estrutura do `useMaterialIndices`. Query sem filtro (tabela global). Mutations de create/update/delete para admin.

---

### 3. Configurações → Regras de Cálculo — Seção "Custos de Mão de Obra"

Em `CalculationRulesTab.tsx`, adicionar uma terceira seção abaixo dos Índices de Material:
- Titulo: "Custos de Mão de Obra por Disciplina"
- Tabela: Disciplina | Tipo Atividade | Custo/m² | Unidade | Região
- Dialog para add/edit/remove (admin only)

---

### 4. Componente `BudgetPreviewDialog.tsx`

Modal "Prévia do Orçamento Executivo":

**Lógica de composição** (por atividade com `area_m2 > 0`):
1. Cruza com `material_indices` → calcula quantidade por material
2. Busca `price_research` (< 30 dias) → usa `price_avg` ou fallback manual
3. `custo_material = Σ(quantidade × preço_médio)` por atividade
4. Cruza `discipline` com `labor_costs` → `custo_mo = area_m2 × cost_per_m2`
5. `total_atividade = custo_material + custo_mo`
6. `total_geral = Σ total_atividade`

**UI do modal:**
- Tabela: Atividade | Disciplina | Área m² | Custo Material | Custo MO | Total
- Subtotais agrupados por disciplina
- Total geral em destaque
- Indicadores de confiança por linha (verde/amarelo/cinza)
- Botão "Exportar como PDF" — client-side com jsPDF (já instalado)
- Botão "Salvar como Cotação" — cria `budget_quotes` via hook existente

---

### 5. Integração na aba Cotações

Em `ProjectBudgetsTab.tsx`, adicionar botão **"Gerar Prévia de Orçamento"** no header da aba, ao lado dos botões existentes. Abre o `BudgetPreviewDialog`.

---

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar `labor_costs` + RLS + seed |
| `src/hooks/useLaborCosts.ts` | **Novo** — CRUD hook |
| `src/components/projects/BudgetPreviewDialog.tsx` | **Novo** — Modal de prévia + PDF |
| `src/components/projects/ProjectBudgetsTab.tsx` | Adicionar botão + importar dialog |
| `src/components/settings/CalculationRulesTab.tsx` | Adicionar seção de custos MO |

Nenhuma outra aba ou rota alterada.

