

## Ajuste de layout na página LeadsPipeline

### Alterações no arquivo `src/pages/LeadsPipeline.tsx`

**1. Linha 112** — Trocar `h-[calc(100vh-12rem)]` por `min-h-[calc(100vh-12rem)]`:
```
h-[calc(100vh-12rem)]  →  min-h-[calc(100vh-12rem)]
```

**2. Linha 224** — Adicionar `max-h-[calc(100vh-16rem)]` ao container Kanban para que as colunas tenham scroll interno sem que o container todo cresça indefinidamente:
```
className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0"
→
className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0 max-h-[calc(100vh-16rem)]"
```

A linha 233 já tem `overflow-y-auto` e `flex-1` nas colunas individuais, garantindo scroll vertical interno em cada coluna.

Nenhuma aba, sub-aba ou rota será alterada.

