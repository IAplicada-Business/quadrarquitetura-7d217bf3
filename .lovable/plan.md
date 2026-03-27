

## Completar FKs RESTRICT nas tabelas restantes de projetos

### Resumo

Adicionar `ON DELETE RESTRICT` em 7 tabelas adicionais que referenciam `projects(id)` sem FK explícita. Limpar órfãos antes de cada constraint. O `handleDeleteError` já cobre o caso `projects` — nenhuma alteração de código necessária.

### Migration SQL

Uma única migration que para cada tabela: limpa órfãos e adiciona FK RESTRICT.

```sql
DELETE FROM public.budget_quotes WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.budget_quotes ADD CONSTRAINT fk_budget_quotes_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

DELETE FROM public.invoices WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

DELETE FROM public.pending_items WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.pending_items ADD CONSTRAINT fk_pending_items_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

DELETE FROM public.purchases WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.purchases ADD CONSTRAINT fk_purchases_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

DELETE FROM public.scenarios WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.scenarios ADD CONSTRAINT fk_scenarios_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

DELETE FROM public.site_diary_entries WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.site_diary_entries ADD CONSTRAINT fk_site_diary_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;

DELETE FROM public.voice_tasks WHERE project_id NOT IN (SELECT id FROM public.projects);
ALTER TABLE public.voice_tasks ADD CONSTRAINT fk_voice_tasks_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE RESTRICT;
```

### Código frontend

Nenhuma alteração. O `handleDeleteError` já tem a mensagem para `projects`: *"Este projeto possui dados vinculados (escopo, cronograma, materiais, etc.) e não pode ser excluído."* — e o `Projects.tsx` já usa `handleDeleteError(e, "projects")` no `onError` da deleção.

### Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Adicionar 7 FKs RESTRICT (com limpeza de orfaos) |

