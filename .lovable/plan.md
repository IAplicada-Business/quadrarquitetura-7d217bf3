

## Contexto Persistente no Chat IA por Projeto

### Migration SQL

```sql
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS project_id uuid;
```

Sem foreign key para evitar problemas com a tabela projects (consistente com o padrão do projeto que não usa FKs).

### 1. Edge Function `chat-assistant` — Buscar histórico anterior

Após verificar o usuário e parsear o body, se `context.project_id` existir:
- Buscar as últimas 10 mensagens de `chat_messages` onde `user_id = userId` e `project_id = context.project_id`, ordenadas por `created_at DESC`
- Reverter a ordem (ASC) e incluir como histórico antes das mensagens da sessão atual
- O `history` enviado pelo frontend continua sendo usado, mas as mensagens do banco são prepended como contexto adicional (deduplicadas por conteúdo se necessário)

```typescript
let dbHistory: any[] = [];
if (context?.project_id) {
  const { data } = await admin.from("chat_messages")
    .select("role, content")
    .eq("user_id", userId)
    .eq("project_id", context.project_id)
    .order("created_at", { ascending: false })
    .limit(10);
  dbHistory = (data || []).reverse();
}
// Merge: dbHistory + session history (dedup), cap at 20
```

### 2. `useAIChat.ts` — Salvar `project_id` nas mensagens

- Aceitar `projectId` como parâmetro opcional no `saveMessage`
- Ao inserir em `chat_messages`, incluir `project_id` quando disponível (extraído do `contextPayload`)

### 3. `useAIChat.ts` — Auto-carregar contexto ao abrir

- Adicionar função `loadProjectContext(projectId: string)` que busca as últimas 5 mensagens com aquele `project_id` e popula `messages`
- Exportar essa função

### 4. `AIChatBox.tsx` — Label de contexto + auto-load

- Quando o chat abre em `/projects/:id` e não há conversa ativa (`currentConversationId === null` e `messages.length === 0`):
  - Chamar `loadProjectContext(projectId)`
  - Exibir label discreto: "Retomando conversa sobre este projeto — últimas 5 mensagens carregadas"
- Label aparece acima das mensagens, desaparece após a primeira mensagem enviada

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | `project_id` em `chat_messages` |
| `supabase/functions/chat-assistant/index.ts` | Buscar últimas 10 msgs do projeto do banco como histórico |
| `src/hooks/useAIChat.ts` | Salvar `project_id`, função `loadProjectContext` |
| `src/components/chat/AIChatBox.tsx` | Auto-load ao abrir em projeto, label de contexto |

