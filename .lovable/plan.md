

## Reestruturar Formulário de Tarefa — Centrado na Atividade

### Resumo
Transformar o formulário de tarefas para ser centrado na **atividade** (não na disciplina). Adicionar novos campos: Descrição do Serviço, Ambiente, Prazo Estimado, Dependências (caminho crítico) e Materiais Associados. Adicionar status "Pendência". Implementar cálculo automático de datas baseado em dependências.

---

### 1. Migração de Banco de Dados

Adicionar colunas à tabela `schedule_tasks`:

```sql
ALTER TABLE schedule_tasks 
  ADD COLUMN description text,
  ADD COLUMN environment text,
  ADD COLUMN estimated_days integer,
  ADD COLUMN dependencies uuid[] DEFAULT '{}',
  ADD COLUMN materials jsonb DEFAULT '[]';
```

- `description` — detalhamento do serviço
- `environment` — ambiente (Suíte Master, Cozinha, etc.)
- `estimated_days` — prazo em dias corridos
- `dependencies` — array de IDs de outras tarefas do mesmo projeto (caminho crítico)
- `materials` — JSON array com `[{name, quantity, unit}]` para materiais associados

Usar `uuid[]` para dependências (mais simples que junction table; são IDs do mesmo projeto). Usar `jsonb` para materiais (preenchimento manual por ora, futuramente vinculado ao orçamento).

---

### 2. Atualizar `ConstructionTaskForm.tsx`

Reestruturar completamente o formulário com a seguinte ordem de campos:

1. **Projeto/Obra** (Select, obrigatório — manter)
2. **Nome da Atividade** (texto, obrigatório — renomear placeholder)
3. **Descrição do Serviço** (textarea — NOVO)
4. **Disciplina** (Select com lista expandida: +Automação, Ar-condicionado, Gesso/Forro, Revestimento, Marcenaria, Piso — classificatória apenas)
5. **Ambiente** (texto livre — NOVO)
6. **Responsável/Fornecedor** (tags — manter)
7. **Prazo Estimado** (input number, em dias — NOVO)
8. **Depende de** (multi-select com checkboxes — NOVO, lista atividades do mesmo projeto)
9. **Data Início** / **Data Fim** (manter, com auto-cálculo)
10. **Status** (adicionar "Pendência" `pendencia`)
11. **Progresso** (slider — manter)
12. **Materiais Associados** (seção expansível — NOVO, lista de {nome, quantidade, unidade})
13. **Observações** (textarea — manter)

**Regras de auto-cálculo:**
- Se "Depende de" preenchido e "Data Início" vazio → Data Início = max(Data Fim das dependências) + 1 dia
- Se "Prazo Estimado" preenchido e "Data Fim" vazio → Data Fim = Data Início + Prazo Estimado

**Props adicionais:** receber `allTasks` (lista de tarefas do mesmo projeto) para popular o campo "Depende de".

Subtarefas herdam projeto e disciplina do pai (comportamento existente mantido).

---

### 3. Atualizar `ConstructionTasks.tsx`

- Passar `allTasks` filtradas pelo projeto selecionado no form para o componente do formulário
- Atualizar mutations `createTask` e `updateTask` para incluir os novos campos: `description`, `environment`, `estimated_days`, `dependencies`, `materials`
- Adicionar coluna "Ambiente" na tabela de listagem
- Adicionar status "Pendência" nos labels e cores (`pendencia: "bg-yellow-100 text-yellow-800"`)
- Incluir "Pendência" nas métricas do dashboard

---

### Detalhes Técnicos

- Disciplinas expandidas: Alvenaria, Elétrica, Hidráulica, Pintura, Acabamento, Demolição, Estrutura, Impermeabilização, Esquadrias, Automação, Ar-condicionado, Gesso/Forro, Revestimento, Marcenaria, Piso, Outros
- Materiais armazenados como `jsonb` array: `[{"name":"Cimento","quantity":10,"unit":"sacos"}]`
- Dependências como `uuid[]` — filtrando apenas tarefas do mesmo projeto (excluindo a própria tarefa)
- Nenhuma rota, aba ou navegação existente será removida ou alterada

