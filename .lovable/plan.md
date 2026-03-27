

## Migrar RLS de `proposal_templates` e `reports` para equipe

### Migration SQL

Dropar as 4 políticas individuais de cada tabela e criar 4 políticas de equipe (mesmo padrão das 16 tabelas já migradas).

```sql
-- proposal_templates (4 políticas individuais → 4 de equipe)
DROP POLICY IF EXISTS "Users can create proposal_templates" ON public.proposal_templates;
DROP POLICY IF EXISTS "Users can view own proposal_templates" ON public.proposal_templates;
DROP POLICY IF EXISTS "Users can update own proposal_templates" ON public.proposal_templates;
DROP POLICY IF EXISTS "Users can delete own proposal_templates" ON public.proposal_templates;

CREATE POLICY "Team can view proposal_templates" ON public.proposal_templates
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create proposal_templates" ON public.proposal_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update proposal_templates" ON public.proposal_templates
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete proposal_templates" ON public.proposal_templates
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));

-- reports (3 políticas individuais → 4 de equipe, adicionando UPDATE)
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;

CREATE POLICY "Team can view reports" ON public.reports
  FOR SELECT USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update reports" ON public.reports
  FOR UPDATE USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete reports" ON public.reports
  FOR DELETE USING (user_id IN (SELECT get_team_user_ids()));
```

### Código frontend

Nenhuma alteração necessária.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Drop 7 políticas individuais + criar 8 políticas de equipe |

