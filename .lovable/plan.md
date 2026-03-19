

## Trigger de irreversibilidade de status no banco de dados

### Contexto
A validação de status irreversível (>= "contratado" não pode regredir) existe apenas no frontend. Chamadas diretas ao banco podem violar essa regra.

### Alteração

**1 migration SQL** — criar function + trigger:

```sql
CREATE OR REPLACE FUNCTION public.check_scope_status_irreversible()
RETURNS TRIGGER AS $$
DECLARE
  status_order text[] := ARRAY['rascunho','planejado','em_cotacao','contratado','em_execucao','executado'];
  old_idx int;
  new_idx int;
BEGIN
  old_idx := array_position(status_order, OLD.status);
  new_idx := array_position(status_order, NEW.status);
  IF old_idx >= 4 AND new_idx < old_idx THEN
    RAISE EXCEPTION 'Status não pode ser revertido após Contratado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scope_status_check
  BEFORE UPDATE ON scope_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_scope_status_irreversible();
```

**Nenhuma alteração de código frontend** — a validação no frontend (toast + select filtrado) permanece como UX; o trigger atua como blindagem no banco.

### Resumo
- 1 migration SQL (function + trigger)
- 0 arquivos editados
- Nenhuma aba, sub-aba ou rota alterada

