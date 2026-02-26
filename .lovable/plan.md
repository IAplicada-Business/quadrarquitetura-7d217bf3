

## Ajustes nas Tarefas de Obra

### Alterações

**1. Atualizar `src/components/construction/ConstructionTaskForm.tsx`**
- Adicionar **seleção de Projeto** (obrigatório) — recebe lista de projetos como prop
- Renomear "Disciplina" → **"Tipo de Tarefa"** com opções predefinidas (Alvenaria, Elétrica, Hidráulica, Pintura, Acabamento, Demolição, Estrutura, Outros)
- Substituir campo único "Responsável/Fornecedor" por **seleção múltipla de responsáveis** (input com tags — digita nome, pressiona Enter, aparece como badge removível). Armazena como texto separado por vírgula no campo `supplier_name`
- Submeter `project_id` junto com os demais dados

**2. Atualizar `src/pages/ConstructionTasks.tsx`**
- Passar lista de `projects` como prop para o formulário
- Usar `project_id` vindo do formulário ao criar tarefa (em vez de inferir do filtro)
- Adicionar coluna "Tipo" e "Responsáveis" na tabela de listagem

Não é necessária migração de banco — reutiliza `discipline` para tipo de tarefa e `supplier_name` para responsáveis (comma-separated).

