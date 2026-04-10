

## Plano: Módulo de Gestão de Conteúdo Funcional

### 1. Migração de banco de dados

Criar duas tabelas com RLS de equipe padrão:

**`content_series`**: id, user_id (not null, references auth.users), name, description, color (default '#1B2A4A'), created_at

**`content_posts`**: id, user_id (not null), title, type (text), platform (default 'instagram'), status (default 'ideia'), scheduled_date, objective, hook, script, hashtags (text[] default '{}'), notes, series_id (uuid), target_audience, tone, created_at

Usar validation triggers em vez de CHECK constraints para type e status. RLS com `get_team_user_ids()` para SELECT/UPDATE/DELETE e `auth.uid() = user_id` para INSERT (padrão do projeto).

### 2. Edge function `content-ai-assistant`

Nova edge function em `supabase/functions/content-ai-assistant/index.ts`. Seguir padrão do `chat-assistant` (CORS, auth via Bearer, LOVABLE_API_KEY). Actions suportadas:
- `generate_script` — gera hook, script, hashtags, CTA, sugestão de thumbnail, melhor horário
- `suggest_ideas` — 5 ideias baseadas em histórico
- `generate_hashtags` — hashtags para post específico
- `rewrite_hook` — reescreve hook

Usa Lovable AI Gateway (`openai/gpt-5-mini`).

### 3. Hooks dedicados

**`src/hooks/useContentSeries.ts`** — CRUD com TanStack Query, staleTime 10min
**`src/hooks/useContentPosts.ts`** — CRUD com TanStack Query, staleTime 5min, inclui filtros
**`src/hooks/useContentCalendar.ts`** — query filtrada por mês/ano

### 4. Componentes compartilhados

**`src/components/content/ContentPostSheet.tsx`** — Sheet lateral de criação/edição com todos os campos (título, tipo, plataforma, série, data, status, objetivo, público-alvo, tom, hook, roteiro, hashtags com tags, notas). Botão "Gerar com IA" que chama a edge function e preenche campos automaticamente.

**`src/components/content/ContentPostCard.tsx`** — Card do Kanban com badge tipo (com cor), título, data, plataforma, hook truncado, botões editar e gerar IA inline.

### 5. Página `/content/calendar` — Calendário funcional

Novo arquivo `src/pages/ContentCalendar.tsx`:
- Header: navegação `< Mês Ano >`, filtro plataforma, botão `+ Novo Post`, botão `Sugestão de ideias`
- Grade mensal: 7 colunas (Dom-Sáb), linhas por semana
- Cada dia mostra pills coloridas por tipo com título truncado (20 chars)
- Clique na pill → abre Sheet com detalhes
- Clique em dia vazio → abre Sheet com data pré-preenchida
- Sidebar desktop: "Próximos 7 posts" com tipo, título, data, status
- Rodapé: barra de progresso "X/30 dias com conteúdo"
- Modal "Sugestão de ideias": chama `suggest_ideas` e exibe cards com as 5 ideias

### 6. Página `/content/scripts` — Kanban funcional

Novo arquivo `src/pages/ContentScripts.tsx`:
- 6 colunas: ideia, roteiro, gravando, editando, agendado, publicado
- Drag-and-drop com `@hello-pangea/dnd` (já disponível ou instalar)
- Ao soltar, atualiza status no banco
- Cards com badge tipo (cor), título, data, plataforma, hook (60 chars), botões editar + gerar IA
- Gerar IA inline: chama edge function, abre Sheet com resultado
- Borda esquerda com cor da série (se o post pertencer a uma)

### 7. Página `/content/posts` — Publicações funcional

Novo arquivo `src/pages/ContentPosts.tsx`:
- 4 KPI cards: posts publicados no mês, em produção, próximo a publicar, % calendário preenchido
- Tabela com colunas: Título, Tipo, Plataforma, Status, Data, Série, Ações
- Filtros: busca por título, multi-select status, tipo, plataforma, DateRange
- Ações: Editar, Duplicar (copia com status='ideia', sem data), Ver roteiro (sheet read-only), Excluir (dialog confirmação)
- Linhas com data passada e status ≠ publicado: fundo vermelho suave
- Ordenação padrão: scheduled_date DESC

### 8. Configurações → aba "Conteúdo"

Em `src/pages/SettingsPage.tsx`, adicionar tab "Conteúdo" com CRUD de `content_series` (nome, descrição, cor com input color). Usar `useContentSeries`.

### 9. Rotas

Atualizar `App.tsx`: substituir as 3 rotas `/content/*` de `ContentPlaceholder` pelos novos componentes.

### Arquivos criados
1. `supabase/functions/content-ai-assistant/index.ts`
2. `src/hooks/useContentPosts.ts`
3. `src/hooks/useContentSeries.ts`
4. `src/hooks/useContentCalendar.ts`
5. `src/components/content/ContentPostSheet.tsx`
6. `src/components/content/ContentPostCard.tsx`
7. `src/pages/ContentCalendar.tsx`
8. `src/pages/ContentScripts.tsx`
9. `src/pages/ContentPosts.tsx`

### Arquivos editados
1. `src/App.tsx` — novas rotas
2. `src/pages/SettingsPage.tsx` — aba Conteúdo

### O que NÃO muda
- Rotas, páginas e funcionalidades existentes
- Sidebar, header, demais componentes

