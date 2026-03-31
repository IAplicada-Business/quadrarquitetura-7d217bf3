

## Limpeza de dados de teste (mantendo Alexandra)

### Migration SQL (via insert tool)

Ordem respeitando FKs:

```sql
-- 1. Filhos do projeto "teste 1"
DELETE FROM voice_tasks WHERE project_id = '94defc4d-5e6e-4a8e-9073-f6b991d26296';
DELETE FROM schedule_tasks WHERE project_id = '94defc4d-5e6e-4a8e-9073-f6b991d26296';
DELETE FROM scope_items WHERE project_id = '94defc4d-5e6e-4a8e-9073-f6b991d26296';
DELETE FROM scenarios WHERE project_id = '94defc4d-5e6e-4a8e-9073-f6b991d26296';

-- 2. Projeto "teste 1"
DELETE FROM projects WHERE id = '94defc4d-5e6e-4a8e-9073-f6b991d26296';

-- 3. Cliente "teste"
DELETE FROM clients WHERE id = '1a89724e-a568-40e7-bfe8-c814438a9612';

-- 4. Cenário "CENARIO TESTE"
DELETE FROM scenarios WHERE id = '944cf6e3-d4de-4b21-b98c-cae30ad2b871';

-- 5. Chat messages e notificações de teste
DELETE FROM chat_messages WHERE true;
DELETE FROM notifications WHERE true;
```

**Alexandra mantida.** Removidos: cliente "teste", projeto "teste 1" + dependências, cenário "CENARIO TESTE", chat messages e notificações.

### Arquivos

Nenhuma alteração de código — apenas deleção de dados via insert tool.

