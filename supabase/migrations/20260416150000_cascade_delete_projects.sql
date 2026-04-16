-- Converte todas as FKs de project_id para ON DELETE CASCADE.
-- Resolve: "Este projeto possui dados vinculados (escopo, cronograma, materiais, etc.) e não pode ser excluído."
-- Com isso, apagar um projeto remove automaticamente escopo, cronograma, orçamentos, pagamentos,
-- materiais, diário de obra, relatórios, documentos, pendências e demais dados vinculados.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
     AND rc.constraint_schema = tc.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.constraint_schema = tc.table_schema
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name
     AND kcu.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'projects'
      AND ccu.column_name = 'id'
      AND rc.delete_rule <> 'CASCADE'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r.table_schema, r.table_name, r.constraint_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.projects(id) ON DELETE CASCADE',
      r.table_schema, r.table_name, r.constraint_name, r.column_name
    );
  END LOOP;
END $$;
