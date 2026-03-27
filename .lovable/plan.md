

## Adicionar políticas UPDATE/DELETE nas tabelas de referência

### Migration SQL

```sql
-- default_disciplines: admin pode editar/remover
CREATE POLICY "default_disciplines_update" ON public.default_disciplines
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "default_disciplines_delete" ON public.default_disciplines
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- calculation_parameters: admin pode editar/remover
CREATE POLICY "calculation_parameters_update" ON public.calculation_parameters
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "calculation_parameters_delete" ON public.calculation_parameters
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- lead_form_submissions: admin pode deletar
CREATE POLICY "lead_form_submissions_delete" ON public.lead_form_submissions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- plant_analyses: usuário pode atualizar próprias análises
CREATE POLICY "plant_analyses_update" ON public.plant_analyses
  FOR UPDATE USING (auth.uid() = user_id);
```

Usa `has_role()` (SECURITY DEFINER) para evitar recursão infinita nas políticas que consultam `user_roles`.

### Código frontend

Nenhuma alteração necessária.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar 6 políticas (2 em default_disciplines, 2 em calculation_parameters, 1 em lead_form_submissions, 1 em plant_analyses) |

