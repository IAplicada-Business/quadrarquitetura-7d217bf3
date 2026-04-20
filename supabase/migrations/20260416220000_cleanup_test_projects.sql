-- Remove projetos de teste Q45 e Q47 solicitados na call de 16/04/2026.
-- Conteudo foi confirmado como teste pela Camilla e ela fez backup em Excel.
-- FKs de project_id ja estao em ON DELETE CASCADE (ver 20260416150000),
-- entao escopo/cronograma/orcamento/materiais/pagamentos vinculados caem juntos.

DELETE FROM public.projects
WHERE project_number IN ('Q45', 'Q47');
