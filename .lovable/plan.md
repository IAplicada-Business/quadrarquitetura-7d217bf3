

## Attach trigger de status irreversível + captura de erro no frontend

### Problema

A função `check_scope_status_irreversible()` existe no banco mas **nenhum trigger** está attached à tabela `scope_items`. Qualquer usuário pode reverter status livremente.

### Migration SQL

```sql
DROP TRIGGER IF EXISTS trg_scope_status_irreversible ON public.scope_items;
CREATE TRIGGER trg_scope_status_irreversible
  BEFORE UPDATE ON public.scope_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_scope_status_irreversible();
```

A função já existe e cobre a lógica correta (bloqueia regressão a partir de index >= 4 / "contratado").

### Código frontend

**Arquivo:** `src/hooks/useScopeItems.ts` — mutation `update` (linha ~80-84)

Alterar `onError` para detectar erro P0001 (RAISE EXCEPTION) e exibir toast amigável:

```typescript
onError: (e: any) => {
  const msg = e?.message || "";
  if (msg.includes("Status não pode ser revertido")) {
    toast({ title: "Ação bloqueada", description: "Este item já foi contratado e não pode ter o status revertido.", variant: "destructive" });
  } else {
    toast({ title: "Erro", description: msg, variant: "destructive" });
  }
},
```

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar trigger `trg_scope_status_irreversible` na tabela `scope_items` |
| `src/hooks/useScopeItems.ts` | Capturar erro P0001 no `onError` do update |

