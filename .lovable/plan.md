

## Duas correções: handleDeleteError para suppliers + RLS de equipe em calculation_rules

### 1. Adicionar mensagem de suppliers no handleDeleteError

**Arquivo:** `src/lib/handleDeleteError.ts`

Adicionar entrada no `FK_MESSAGES`:
```typescript
suppliers: "Este fornecedor está alocado em obras e não pode ser excluído. Remova as alocações primeiro.",
```

### 2. Aplicar handleDeleteError no Suppliers.tsx

**Arquivo:** `src/pages/Suppliers.tsx`

A mutation `remove` (linha 65-74) não tem `onError`. Adicionar:
```typescript
onError: (error: any) => handleDeleteError(error, "suppliers"),
```

E importar `handleDeleteError` no topo do arquivo.

### 3. Migration: calculation_rules para RLS de equipe

Drop 4 políticas individuais e criar 4 de equipe:

```sql
DROP POLICY IF EXISTS "Users can delete own rules" ON public.calculation_rules;
DROP POLICY IF EXISTS "Users can insert own rules" ON public.calculation_rules;
DROP POLICY IF EXISTS "Users can update own rules" ON public.calculation_rules;
DROP POLICY IF EXISTS "Users can view own rules" ON public.calculation_rules;

CREATE POLICY "Team can view calculation_rules" ON public.calculation_rules
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create calculation_rules" ON public.calculation_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update calculation_rules" ON public.calculation_rules
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete calculation_rules" ON public.calculation_rules
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
```

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/lib/handleDeleteError.ts` | Adicionar entrada `suppliers` no `FK_MESSAGES` |
| `src/pages/Suppliers.tsx` | Importar `handleDeleteError`, adicionar `onError` na mutation `remove` |
| Migration SQL | Drop 4 políticas individuais + criar 4 de equipe em `calculation_rules` |

