

## FKs faltantes + fechar INSERTs abertos

### Migration SQL

Uma única migration com 4 operações:

1. **FK `material_tracking` → `projects`**: limpar órfãos + adicionar FK RESTRICT
2. **FK `material_calculations` → `projects`**: limpar órfãos + adicionar FK RESTRICT
3. **Restringir INSERT de `calculation_parameters`** a admin via `has_role()`
4. **Restringir INSERT de `default_disciplines`** a admin via `has_role()`

```sql
-- 1. material_tracking FK
DELETE FROM public.material_tracking
  WHERE project_id IS NOT NULL
  AND project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.material_tracking
  ADD CONSTRAINT fk_material_tracking_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- 2. material_calculations FK
DELETE FROM public.material_calculations
  WHERE project_id IS NOT NULL
  AND project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.material_calculations
  ADD CONSTRAINT fk_material_calculations_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

-- 3. calculation_parameters INSERT → admin only
DROP POLICY IF EXISTS "Authenticated can insert calculation_parameters" ON public.calculation_parameters;
CREATE POLICY "calculation_parameters_insert" ON public.calculation_parameters
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. default_disciplines INSERT → admin only
DROP POLICY IF EXISTS "Authenticated can insert default_disciplines" ON public.default_disciplines;
CREATE POLICY "default_disciplines_insert" ON public.default_disciplines
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

Usa `has_role()` (SECURITY DEFINER) para evitar recursão. Nenhuma alteração no frontend.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | 2 FKs RESTRICT + 2 INSERT policies restritas a admin |

