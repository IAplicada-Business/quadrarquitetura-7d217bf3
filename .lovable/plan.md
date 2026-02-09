

# Corrigir sobreposicao de cards no Pipeline de Leads

## Problema

O kanban usa `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6` com `overflow-x-auto`, mas CSS Grid nao faz scroll horizontal — ele empilha as colunas. Quando combinado com `min-w-[220px]` nos filhos, as colunas se sobrepoem em vez de rolar.

## Solucao

Trocar o container do kanban de `grid` para `flex` com scroll horizontal:

**Arquivo:** `src/pages/LeadsPipeline.tsx`

**Linha 164 — Trocar:**
```
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
```

**Por:**
```
<div className="flex gap-4 overflow-x-auto pb-4">
```

**Linha 168 — Trocar:**
```
<div key={status} className="min-w-[220px]">
```

**Por:**
```
<div key={status} className="min-w-[250px] w-[250px] flex-shrink-0">
```

Isso garante que:
- Cada coluna do kanban tem largura fixa de 250px
- `flex-shrink-0` impede que sejam comprimidas
- O container flex com `overflow-x-auto` permite scroll horizontal
- `pb-4` adiciona espaco para a scrollbar

