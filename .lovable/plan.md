

## Migrar `settings` para RLS de equipe com escopo team/personal

### Análise do estado atual

A tabela `settings` armazena tudo num registro por usuário:
- `theme` — preferência pessoal (dark/light)
- `supplier_categories` — categorias de fornecedores do escritório
- `calculation_params` — tabela de custo por m² do escritório
- `message_templates` — templates de comunicação do escritório

Atualmente as 3 políticas RLS filtram por `user_id = auth.uid()` — Camilla e Mariana têm registros independentes. Apenas `theme` deve ser pessoal; o resto é configuração do escritório.

### Solução

Adicionar coluna `scope` (`'team'` ou `'personal'`) e substituir as políticas para que registros `team` sejam visíveis/editáveis pelo time.

### Migration SQL

```sql
-- 1. Adicionar coluna scope
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'team';

-- 2. Marcar registros existentes como 'team' (todos são config de escritório hoje)
UPDATE public.settings SET scope = 'team' WHERE scope IS NULL OR scope = 'team';

-- 3. Dropar políticas existentes
DROP POLICY IF EXISTS "Users can create settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;

-- 4. Criar novas políticas com escopo
CREATE POLICY "settings_select" ON public.settings
  FOR SELECT TO authenticated
  USING (
    (scope = 'team' AND user_id IN (SELECT get_team_user_ids()))
    OR (scope = 'personal' AND user_id = auth.uid())
  );

CREATE POLICY "settings_insert" ON public.settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "settings_update" ON public.settings
  FOR UPDATE TO authenticated
  USING (
    (scope = 'team' AND user_id IN (SELECT get_team_user_ids()))
    OR (scope = 'personal' AND user_id = auth.uid())
  );
```

### Código frontend

**Arquivo: `src/hooks/useCostReferenceTable.ts`**

Alterar a query SELECT para buscar qualquer registro `scope = 'team'` do time (não filtrar por `user_id = user.id`):

```typescript
// SELECT: buscar config do time
const { data, error } = await supabase
  .from("settings")
  .select("id, calculation_params, user_id")
  .eq("scope", "team")
  .maybeSingle();
```

No save, buscar o registro team existente (de qualquer membro do time) e fazer update, ou criar novo com `scope: 'team'`:

```typescript
// Buscar existente do time
const { data: existing } = await supabase
  .from("settings")
  .select("id, calculation_params")
  .eq("scope", "team")
  .maybeSingle();

if (existing) {
  await supabase.from("settings").update({ calculation_params: newParams }).eq("id", existing.id);
} else {
  await supabase.from("settings").insert({ user_id: user.id, calculation_params: newParams, scope: "team" });
}
```

Remover o filtro `.eq("user_id", user.id)` das queries, já que o RLS cuida do acesso.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar coluna `scope`, dropar 3 políticas individuais, criar 3 de equipe |
| `src/hooks/useCostReferenceTable.ts` | Remover filtro `user_id`, adicionar filtro `scope = 'team'` |

