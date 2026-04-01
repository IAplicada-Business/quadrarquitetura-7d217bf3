

## Chat IA Contextual + 3 Atalhos de IA nos Projetos

### 1. Chat IA com contexto da rota atual

**`src/hooks/useAIChat.ts`**: Adicionar parâmetro `contextPayload` ao `sendMessage`, que será enviado ao edge function junto com `message`, `conversation_id` e `history`.

**`src/components/chat/AIChatBox.tsx`**:
- Importar `useLocation` e `useParams` (via wrapper ou prop)
- Detectar rota `/projects/:id`: buscar projeto (nome, Q-number, cliente), atividades, pagamentos do projeto via queries existentes
- Detectar rota `/leads/*`: buscar lead selecionado se houver
- Passar `contextPayload: { route, project_context?, lead_context? }` ao `sendMessage`
- Atualizar perguntas pré-definidas conforme contexto (ex: dentro de projeto mostrar "Qual o progresso deste projeto?")

**`supabase/functions/chat-assistant/index.ts`**:
- Receber `context` no body
- Se `context.project_id` presente: buscar `projects`, `project_activities`, `payments`, `scenarios` desse projeto e injetar bloco extra no system prompt com dados específicos do projeto
- Se `context.lead_id` presente: buscar lead e propostas associadas

### 2. Edge Function `project-ai-assistant`

**`supabase/functions/project-ai-assistant/index.ts`** — Nova function que recebe `{ project_id, action, data }`:

- **`action: 'sequence'`**: Recebe lista de atividades, envia ao Lovable AI com prompt para sequenciamento lógico de obra, retorna JSON estruturado via tool calling `{ suggestions: [{ activity_id, suggested_position, depends_on_id, reason }] }`

- **`action: 'analyze_budget'`**: Recebe itens do orçamento + dados de `price_research`, envia ao Lovable AI pedindo análise comparativa, retorna `{ analysis_text, items: [{ name, current_price, avg_price, status: 'above'|'below'|'ok' }] }`

- **`action: 'weekly_summary'`**: Recebe `site_diary_entries` da semana, retorna `{ summary, next_steps, client_pending }`

### 3. Atalho "Sugerir Sequenciamento" — Aba Escopo

**`src/components/projects/ProjectScopeTab.tsx`**:
- Adicionar botão "Sugerir Sequenciamento" (ícone Sparkles)
- Ao clicar: chama `project-ai-assistant` com `action: 'sequence'` + lista de atividades
- Exibe modal com tabela: atividade | posição sugerida | predecessora | motivo | checkbox aceitar
- Ao confirmar: atualiza `depends_on` e `position` das atividades selecionadas via `useProjectActivities.update`

### 4. Atalho "Analisar Orçamento" — Aba Cotações

**`src/components/projects/ProjectScenariosTab.tsx`**:
- Adicionar botão "Analisar Orçamento" (ícone BarChart)
- Ao clicar: busca cenário aprovado + `price_research` do projeto, envia ao `project-ai-assistant` com `action: 'analyze_budget'`
- Exibe modal com itens coloridos (vermelho = acima, verde = economia) + texto de análise

### 5. Atalho "Gerar Resumo Semanal" — Aba Acompanhamento

**`src/components/projects/ProjectTrackingTab.tsx`**:
- Adicionar botão "Gerar Resumo Semanal" (ícone Sparkles)
- Ao clicar: busca `site_diary_entries` da semana atual, envia ao `project-ai-assistant` com `action: 'weekly_summary'`
- Preenche automaticamente o formulário do `WeeklyReportModal` com os campos retornados
- Usuária revisa e confirma antes de salvar

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/project-ai-assistant/index.ts` | **Novo** — Edge function para 3 ações de IA |
| `src/hooks/useAIChat.ts` | Adicionar suporte a `contextPayload` |
| `src/components/chat/AIChatBox.tsx` | Detectar rota, injetar contexto, perguntas dinâmicas |
| `supabase/functions/chat-assistant/index.ts` | Receber e processar contexto de projeto/lead |
| `src/components/projects/ProjectScopeTab.tsx` | Botão + modal "Sugerir Sequenciamento" |
| `src/components/projects/ProjectScenariosTab.tsx` | Botão + modal "Analisar Orçamento" |
| `src/components/projects/ProjectTrackingTab.tsx` | Botão "Gerar Resumo Semanal" |

Nenhuma rota ou migration necessária.

