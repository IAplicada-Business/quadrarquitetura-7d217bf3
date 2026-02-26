

# IA Chat - Assistente Inteligente com Contexto da Empresa

## Resumo
Chat flutuante no canto inferior direito (estilo minimal chat box) com cores da marca. O assistente consulta todas as tabelas do sistema para responder perguntas sobre projetos, leads, financeiro, tarefas, etc. Historico de conversas salvo por usuario.

## Arquitetura

```text
[Chat UI] -> Edge Function (chat-assistant)
  -> Consulta banco (projects, leads, payments, etc.)
  -> Envia contexto + pergunta para Lovable AI (Gemini)
  -> Streaming de resposta
  -> Salva historico em chat_messages
```

## Etapas

### 1. Criar tabelas no banco
- `chat_conversations` (id, user_id, title, created_at, updated_at) com RLS
- `chat_messages` (id, conversation_id, user_id, role, content, created_at) com RLS

### 2. Criar edge function `chat-assistant`
- Recebe mensagem + conversation_id + historico recente
- Consulta banco com service role key para buscar dados contextuais do usuario:
  - Projetos ativos, leads, pagamentos pendentes, tarefas de voz, compras, fornecedores, cronograma, etc.
- Monta system prompt com contexto real dos dados
- Chama Lovable AI (google/gemini-3-flash-preview) com streaming
- Tom profissional, sem emojis em excesso, bullets bem-vindos
- Retorna stream SSE

### 3. Criar componente `AIChatBox`
- Botao flutuante no canto inferior direito com icone MessageCircle na cor accent (rosa)
- Ao clicar, abre chat box animado (framer-motion)
- Perguntas pre-definidas na tela inicial:
  - "Quais sao meus projetos ativos?"
  - "Qual o status financeiro geral?"
  - "Quais leads estao pendentes?"
  - "Quais tarefas estao atrasadas?"
  - "Resumo das compras pendentes"
- Renderizar respostas com markdown (react-markdown)
- Input de texto na parte inferior
- Historico de conversas acessivel por sidebar/dropdown

### 4. Criar hook `useAIChat`
- Gerencia state de mensagens, streaming, conversas
- Salva mensagens no banco (chat_messages)
- Lista conversas anteriores
- Streaming token-by-token

### 5. Integrar no AppLayout
- Renderizar `AIChatBox` dentro do layout, visivel em todas as paginas

## Detalhes Tecnicos
- **Streaming**: SSE com parsing line-by-line conforme padrao Lovable AI
- **Contexto**: Edge function faz queries no banco usando service role para montar resumo dos dados do usuario antes de enviar ao modelo
- **Historico**: Ultimas 20 mensagens da conversa enviadas como contexto
- **Markdown**: Instalar `react-markdown` para renderizar respostas formatadas
- **Perguntas pre-definidas**: Chips clicaveis que enviam a pergunta diretamente

