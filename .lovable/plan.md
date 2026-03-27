

## Fechar lacunas menores de RLS

### Migration SQL

```sql
-- 1. DELETE em settings — usuário pode deletar próprios registros
CREATE POLICY "settings_delete" ON public.settings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 2. lead_form_submissions UPDATE — restringir ao time
DROP POLICY IF EXISTS "Authenticated users can update submissions" ON public.lead_form_submissions;
CREATE POLICY "lead_form_submissions_team_update" ON public.lead_form_submissions
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT get_team_user_ids()));
```

Nota: uso `get_team_user_ids()` em vez de query direta em `team_members` para manter consistência com o padrão do projeto e evitar problemas de RLS recursivo.

### Código frontend

Nenhuma alteração necessária.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | 1 policy DELETE em `settings` + 1 policy UPDATE substituída em `lead_form_submissions` |

