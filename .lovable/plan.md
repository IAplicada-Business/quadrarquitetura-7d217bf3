

## Correção: formulário de edição não preenche dados existentes

**Causa raiz**: `ScheduleTaskForm` inicializa os estados com `initialData` apenas no `useState` (mount). Quando `initialData` muda (ao clicar editar), os campos não atualizam porque não há `useEffect` para sincronizar.

### Alteração

**`src/components/projects/ScheduleTaskForm.tsx`**:
- Adicionar `useEffect` que observa `initialData` e `open` para atualizar todos os campos do formulário quando o dialog abre com dados de edição
- Resetar campos quando abre sem dados (nova tarefa)

```typescript
useEffect(() => {
  if (open) {
    setTaskName(initialData?.task_name as string || "");
    setScopeItemId(initialData?.scope_item_id as string || "");
    setStartDate(initialData?.start_date as string || "");
    setEndDate(initialData?.end_date as string || "");
    setStatus(initialData?.status as string || "planejado");
    setPaymentNote(initialData?.payment_note as string || "");
    setOrderIndex(initialData?.order_index ? String(initialData.order_index) : "");
    setSupplierName(initialData?.supplier_name as string || "");
    setDiscipline(initialData?.discipline as string || "");
    setIsClientVisible(initialData?.is_client_visible !== false);
    setIsDailyDetail(!!initialData?.is_daily_detail);
    setRequiresPresence(!!initialData?.requires_presence);
    setProgress(Number(initialData?.progress_percentage) || 0);
    setColor(initialData?.color as string || "#3b82f6");
  }
}, [initialData, open]);
```

Isso garante que ao clicar "Editar" os campos venham preenchidos com os dados atuais da tarefa.

