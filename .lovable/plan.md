

## Atualizar material_tracking existente quando quantity_needed diverge

### Alteração

**`src/hooks/useBudgetQuotes.ts`** — linhas 27-32

Substituir a verificação que retorna silenciosamente por uma lógica que:
1. Busca `id` e `quantity_needed` do tracking existente
2. Se existe e `quantity_needed` difere de `materialEstimate`, faz `update` no registro
3. Se existe e valores são iguais, retorna sem fazer nada
4. Se não existe, continua com a criação (lógica atual preservada)

```typescript
const { data: existing } = await supabase
  .from("material_tracking")
  .select("id, quantity_needed")
  .eq("budget_quote_id", budgetQuoteId)
  .limit(1);

if (existing && existing.length > 0) {
  if (existing[0].quantity_needed !== materialEstimate) {
    await supabase.from("material_tracking")
      .update({ quantity_needed: materialEstimate })
      .eq("id", existing[0].id);
    queryClient.invalidateQueries({ queryKey: ["material_tracking", projectId] });
  }
  return;
}
```

### Resumo
- 1 arquivo editado, ~5 linhas alteradas
- Nenhuma aba, sub-aba ou rota alterada

