

## Ajuste: cor do texto do header do chat

O header do chat usa `bg-sidebar` (azul escuro) mas o texto usa `text-foreground` e `text-muted-foreground`, que são escuros e ficam invisíveis.

### Alteração

Arquivo: `src/components/chat/AIChatBox.tsx`

- Linha 99: trocar `text-foreground` por `text-white` no título "Assistente IA"
- Linha 100: trocar `text-muted-foreground` por `text-white/70` no subtítulo "Quadra Arquitetura"

