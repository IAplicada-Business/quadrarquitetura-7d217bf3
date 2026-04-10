

## Plano: Adicionar botões de IA nas abas do projeto

### 1. Edge Function — novos actions em `project-ai-assistant`
Adicionar 4 novos actions à edge function existente:

- **`estimate_costs`**: Recebe lista de atividades, retorna `[{ activity_name, estimated_cost_min, estimated_cost_max, unit, notes }]` via tool call
- **`generate_materials`**: Recebe lista de atividades, retorna `[{ activity_name, material_name, quantity, unit, notes }]`
- **`generate_schedule`**: Recebe lista de atividades, retorna `[{ activity_name, duration_days, depends_on_activity_name, week_number }]`
- **`financial_analysis`**: Recebe receita, despesas, pendentes, progresso — retorna `{ analysis_text, risks, recommendations }`
- **`weekly_insights`**: Recebe entradas do diário, retorna `{ advances, issues, suggestions }`

### 2. `ProjectBudgetsTab.tsx` — botão "Estimar custos com IA"
- Adicionar botão com ícone `Sparkles` ao lado dos existentes
- Ao clicar: chama `estimate_costs` com atividades do escopo
- Modal com tabela de resultados (atividade, min, max, média, notas)
- Botão "Aplicar" → cria/atualiza `budget_quotes` com `value = (min+max)/2`

### 3. `ProjectMaterialsTab.tsx` — botão "Calcular materiais com IA"
- Botão `Sparkles` ao lado dos botões existentes no topo
- Chama `generate_materials` com atividades
- Modal com checklist dos materiais sugeridos
- Botão "Importar selecionados" → cria `material_tracking` para cada item marcado

### 4. `ProjectScheduleTab.tsx` — botão "Gerar cronograma com IA"
- Botão `Sparkles` ao lado dos existentes
- Chama `generate_schedule` com atividades
- Modal com visualização da sequência proposta (tabela com duração e dependências)
- Botão "Aplicar ao cronograma" → atualiza `start_date`/`end_date` das `project_activities` calculando a partir da data de início do projeto

### 5. `ProjectFinancialTab.tsx` — botão "Análise financeira com IA"
- Botão `Sparkles` no header da aba
- Chama `financial_analysis` com dados do DRE (receita, despesas, pendentes, progresso)
- Modal com análise em texto + opção "Copiar texto"

### 6. `ProjectDocumentsTab.tsx` — botão "Resumir" por documento
- Botão pequeno `Sparkles` em cada linha da tabela de documentos
- Chama edge function `analyze-plant` (já existente) com instrução de resumo
- Modal com resultado em bullet points

### 7. `ProjectTrackingTab.tsx` — botão "Insights da semana"
- Botão `Sparkles` visível no topo da aba (ao lado do "Gerar Resumo Semanal" já existente)
- Chama `weekly_insights` com entradas da semana
- Modal com avanços, problemas, sugestões

### Arquivos alterados
1. `supabase/functions/project-ai-assistant/index.ts` — 5 novos actions
2. `src/components/projects/ProjectBudgetsTab.tsx` — botão + modal IA
3. `src/components/projects/ProjectMaterialsTab.tsx` — botão + modal IA
4. `src/components/projects/ProjectScheduleTab.tsx` — botão + modal IA
5. `src/components/projects/ProjectFinancialTab.tsx` — botão + modal IA
6. `src/components/projects/ProjectDocumentsTab.tsx` — botão + modal IA
7. `src/components/projects/ProjectTrackingTab.tsx` — botão insights

### O que NÃO muda
- Nenhuma rota existente
- Nenhuma outra aba ou componente
- Lógica existente de geração de resumo semanal (apenas adiciona botão de insights)

