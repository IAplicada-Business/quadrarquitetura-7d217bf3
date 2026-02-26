

## Correção: criar formulário dedicado para "Tarefas por Obra"

O formulário atual (`ScheduleTaskForm`) foi feito para o cronograma de projeto (Gantt) e usa terminologia "Etapa" com campos irrelevantes para tarefas de obra (cor, detalhe diário, requer presença, visível para cliente, disciplina de escopo, etc.).

### Alterações

**1. Criar `src/components/construction/ConstructionTaskForm.tsx`**
- Formulário simplificado com título "Nova Tarefa" / "Editar Tarefa"
- Campos relevantes:
  - Nome da Tarefa (obrigatório)
  - Responsável/Fornecedor
  - Status (Planejado, Em Execução, Executado, Atrasado)
  - Data Início / Data Fim
  - Progresso (slider 0-100%)
  - Disciplina (texto livre)
  - Observações (textarea)
- Sem: cor, ordem, escopo, detalhe diário, requer presença, visível para cliente, nota de pagamento

**2. Atualizar `src/pages/ConstructionTasks.tsx`**
- Importar `ConstructionTaskForm` em vez de `ScheduleTaskForm`
- Mapear campos corretamente (observações → `payment_note` no banco, já que é o campo texto disponível)

