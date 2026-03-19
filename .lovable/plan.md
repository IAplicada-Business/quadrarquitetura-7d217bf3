

## Regras de Cálculo — Nova subaba em Configurações

### Contexto
Adicionar subaba "Regras de Cálculo" na página de Configurações, com CRUD completo e seeds de regras padrão. A página atual não tem sistema de abas — será convertida para usar Tabs, com "Geral" contendo o conteúdo existente.

### Alterações

**1. Migration SQL** — criar tabela + seeds

```sql
CREATE TABLE calculation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  discipline text NOT NULL,
  variable_name text NOT NULL,
  formula text NOT NULL,
  result_name text NOT NULL,
  unit text NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE calculation_rules ENABLE ROW LEVEL SECURITY;
-- RLS: user owns their rules
CREATE POLICY "Users can view own rules" ON calculation_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON calculation_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON calculation_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON calculation_rules FOR DELETE USING (auth.uid() = user_id);
-- updated_at trigger
CREATE TRIGGER update_calculation_rules_updated_at
  BEFORE UPDATE ON calculation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Seeds (9 regras padrão) will be inserted via the seed mechanism on first load in the hook — if user has 0 rules, auto-insert the defaults. This avoids needing a global seed that doesn't know user_id.

**2. New hook `src/hooks/useCalculationRules.ts`**
- CRUD operations via react-query + supabase
- `useQuery` to fetch rules ordered by discipline
- `useMutation` for create, update, delete
- Auto-seed: if query returns empty, insert 9 default rules for current user

**3. New component `src/components/settings/CalculationRulesTab.tsx`**
- Table grouped by discipline showing: Disciplina, Variavel, Formula, Resultado, Unidade, Ativo (Switch), Acoes (edit/delete)
- "Nova Regra" button opens Dialog with form:
  - Discipline Select (same 16 options from ConstructionTaskForm)
  - Variable name (Input)
  - Formula (Input)
  - Result name (Input)
  - Unit Select (un, m, m², m³, kg, litro, pacote, rolo, saco)
  - Notes (Textarea)
  - Active toggle (Switch)
- Edit reuses same dialog
- Delete with confirmation

**4. Edit `src/pages/SettingsPage.tsx`**
- Wrap existing content in a `Tabs` component with two tabs: "Geral" and "Regras de Cálculo"
- "Geral" tab contains all current cards (Profile, Theme, Cost table, placeholders)
- "Regras de Cálculo" tab renders `<CalculationRulesTab />`

### Arquivos criados/editados
- 1 migration SQL (table + RLS + trigger)
- 1 hook criado: `useCalculationRules.ts`
- 1 componente criado: `CalculationRulesTab.tsx`
- 1 arquivo editado: `SettingsPage.tsx` (add Tabs wrapper)
- Nenhuma aba, sub-aba ou rota existente alterada

