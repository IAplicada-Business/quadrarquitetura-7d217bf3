

## Migrar `discipline_priorities` para RLS de equipe

### Migration SQL

Dropar 4 políticas individuais e criar 4 de equipe, usando o padrão `IN (SELECT get_team_user_ids())` consistente com as demais tabelas.

```sql
DROP POLICY IF EXISTS "Users can create discipline_priorities" ON public.discipline_priorities;
DROP POLICY IF EXISTS "Users can view own discipline_priorities" ON public.discipline_priorities;
DROP POLICY IF EXISTS "Users can update own discipline_priorities" ON public.discipline_priorities;
DROP POLICY IF EXISTS "Users can delete own discipline_priorities" ON public.discipline_priorities;

CREATE POLICY "Team can view discipline_priorities" ON public.discipline_priorities
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create discipline_priorities" ON public.discipline_priorities
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update discipline_priorities" ON public.discipline_priorities
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete discipline_priorities" ON public.discipline_priorities
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
```

### Código frontend

Nenhuma alteração necessária.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Drop 4 políticas individuais + criar 4 de equipe |

