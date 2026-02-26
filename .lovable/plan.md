

# Correção: Agente de Voz não salva tarefas

## Diagnóstico
A edge function `process-voice-command` funciona corretamente (testei e retorna JSON válido). O problema está no fluxo cliente:

1. **`voice_tasks` usa `as any` desnecessariamente** - a tabela já está nos tipos gerados, o cast `as any` pode interferir no parsing da resposta do Supabase client
2. **Falta de logging** no `handleTranscript` e no `createBatch` para identificar onde o erro ocorre
3. **`project_id` do AI pode vir como string `"null"`** ao invés de `null` real, causando falha na foreign key

## Alterações

### 1. `src/hooks/useVoiceTasks.ts`
- Remover todos os `as any` de `supabase.from("voice_tasks")` - a tabela existe nos tipos
- Adicionar `console.log` antes de cada insert para debug
- Tratar `project_id` do AI como fallback corretamente

### 2. `src/components/layout/VoiceAgentDialog.tsx`
- Adicionar `console.log` do `data` retornado pela edge function para debug
- Tratar caso onde `data.project_id` é string `"null"` ou inválido
- Melhorar mensagem de erro com mais contexto

### 3. `supabase/functions/process-voice-command/index.ts`
- Forçar `project_id` como `null` explícito (não string) quando não identificado no prompt/schema

