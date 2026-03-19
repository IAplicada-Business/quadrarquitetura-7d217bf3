

## ALTERAÇÃO 6 — Botão "Importar Planta" (placeholder)

### Resumo
Adicionar botão desabilitado ao lado de "Nova Atividade" na página Tarefas por Obra, com tooltip explicativo e ícones de upload + sparkle.

### Arquivo: `src/pages/ConstructionTasks.tsx`

**Linha ~406-408** — Ao lado do botão "Nova Atividade", adicionar:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span tabIndex={0}>
      <Button disabled className="opacity-50 cursor-not-allowed">
        <Upload className="h-4 w-4 mr-1" />
        <Sparkles className="h-3 w-3 mr-1" />
        Importar Planta (em breve)
      </Button>
    </span>
  </TooltipTrigger>
  <TooltipContent>
    Suba uma planta em PDF e a IA gerará automaticamente a lista de atividades e quantidades
  </TooltipContent>
</Tooltip>
```

- Importar `Upload`, `Sparkles` de `lucide-react`
- Importar `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` de `@/components/ui/tooltip`
- Envolver os botões do header com `<TooltipProvider>` (necessário para Radix tooltip)

### Nenhuma outra alteração necessária
- Sem migração, sem novo componente, sem nova rota

