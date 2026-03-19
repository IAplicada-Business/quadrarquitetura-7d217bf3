

## Trava de Status no Escopo da Obra

### Resumo
Implementar hierarquia irreversível de status no escopo: após "Contratado", o status só avança. Adicionar "Rascunho" e "Executado" à lista de status. Mostrar cadeado visual e bloquear retrocesso.

---

### 1. Atualizar `ProjectScopeTab.tsx`

**Expandir `statusConfig`** para incluir todos os 6 status na ordem hierárquica:
- `rascunho` → `planejado` → `em_cotacao` → `contratado` → `em_execucao` → `executado`

**Criar array de hierarquia** `STATUS_HIERARCHY = ["rascunho", "planejado", "em_cotacao", "contratado", "em_execucao", "executado"]` para determinar o índice de cada status.

**Definir índice de bloqueio**: status com índice >= 3 (`contratado`) é "locked" — só pode avançar.

**No Select de status inline** (linha ~92-101):
- Filtrar opções: mostrar apenas status com índice >= índice atual
- Se status atual é "contratado" ou posterior, exibir ícone 🔒 ao lado do SelectTrigger

**No `handleStatusChange`**:
- Antes de chamar `update.mutate`, verificar se o novo status tem índice >= índice atual
- Se não, exibir toast: `"Status 'Contratado' não pode ser revertido"` (ou o label do status atual) e não executar a mutation

### 2. Atualizar `ScopeItemForm.tsx`

**No Select de status do formulário de edição** (linha ~100):
- Receber o status atual do item sendo editado
- Filtrar `scopeStatusOptions` para mostrar apenas status com índice >= índice do status atual
- Adicionar "Rascunho" e "Executado" às opções de status

### Detalhes técnicos

- Hierarquia: `["rascunho", "planejado", "em_cotacao", "contratado", "em_execucao", "executado"]`
- Threshold de bloqueio: índice 3 (`contratado`) — a partir daqui, retrocesso bloqueado
- Validação apenas no frontend (conforme solicitado)
- Nenhuma migração necessária — os valores de status já são texto livre
- Nenhuma rota ou aba será removida ou alterada

