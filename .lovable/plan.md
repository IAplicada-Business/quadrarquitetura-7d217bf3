

## Mensagem amigável ao bloquear deleção por FK

### Resumo
Criar função utilitária `handleDeleteError` e usá-la nos `onError` de deleção em `useLeads`, `useProposals` e `useContracts`.

### 1. Novo arquivo `src/lib/handleDeleteError.ts`

```typescript
import { toast } from "@/hooks/use-toast";

const FK_MESSAGES: Record<string, string> = {
  leads: "Este lead possui propostas vinculadas e não pode ser excluído. Remova as propostas primeiro.",
  proposals: "Esta proposta possui um contrato vinculado. Remova o contrato primeiro.",
};

const GENERIC_FK = "Este registro está vinculado a outros dados e não pode ser excluído.";

export function handleDeleteError(error: any, table?: string) {
  const code = error?.code;
  if (code === "23503") {
    toast({
      title: "Não é possível excluir",
      description: (table && FK_MESSAGES[table]) || GENERIC_FK,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Erro ao remover",
      description: error?.message || "Erro desconhecido",
      variant: "destructive",
    });
  }
}
```

### 2. Alterações nos hooks

Em cada hook, substituir o `onError` do `remove` mutation:

- **`useLeads.ts`** linha 109: `onError: (e) => handleDeleteError(e, "leads")`
- **`useProposals.ts`** linha 91: `onError: (e) => handleDeleteError(e, "proposals")`
- **`useContracts.ts`** linha 73: `onError: (e) => handleDeleteError(e, "contracts")`

**Nota**: O erro do Supabase JS inclui `.code` no objeto de erro quando é um `PostgrestError`, então a verificação `error.code === "23503"` funciona diretamente.

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/lib/handleDeleteError.ts` | Criar função utilitária |
| `src/hooks/useLeads.ts` | Usar `handleDeleteError` no `onError` do remove |
| `src/hooks/useProposals.ts` | Usar `handleDeleteError` no `onError` do remove |
| `src/hooks/useContracts.ts` | Usar `handleDeleteError` no `onError` do remove |

