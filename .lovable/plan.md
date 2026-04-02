

## Correções Técnicas — Auditoria

### 1. Persistir sidebar em localStorage

**`src/components/layout/AppSidebar.tsx`**:
- Inicializar `openGroups` lendo `localStorage.getItem('sidebar_groups')` como fallback
- No `useEffect` de auto-expand por rota: só expandir se o grupo não foi manualmente colapsado. Adicionar `ref` `manualOverrides` para rastrear grupos que o usuário colapsou/expandiu manualmente
- No `toggleGroup`: marcar o grupo como "manual override" e salvar estado em `localStorage`
- Resultado: preferência manual do usuário persiste entre reloads; rota atual só expande automaticamente se não houver override manual

### 2. Remover App.css

- Deletar `src/App.css` (não há import — já confirmado via busca)
- O arquivo é dead code com estilos conflitantes (`#root max-width: 1280px`)

### 3. Configurar QueryClient com staleTime

**`src/App.tsx`** linha 32:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 4. Remover emojis dos dashboards

| Arquivo | Linha | De → Para |
|---|---|---|
| `DashboardEscritorio.tsx:446` | `Tudo em dia 🎉` | `Tudo em dia` + ícone `CheckCircle2` inline |
| `DashboardEscritorio.tsx:466` | `Todas enviadas ✓` | `Todas enviadas` + `<CheckCircle2 className="h-3 w-3 inline" />` |
| `DashboardEscritorio.tsx:486` | `Todos acompanhados ✓` | Idem |
| `DashboardObras.tsx:328` | `Nenhuma tarefa atrasada 🎉` | Remover emoji |
| `DashboardObras.tsx:356` | `Nenhum material atrasado 🎉` | Remover emoji |
| `DashboardObras.tsx:387` | `Nenhum pagamento vencido 🎉` | Remover emoji |
| `ProjectOnboardingGuide.tsx:90` | `Projeto configurado com sucesso! 🎉` | Remover emoji (já tem ícone `PartyPopper`) |

Não alterar os `✓` em `BudgetPreviewDialog` (PDF), `ProposalFormNew` (UI de seleção), `ImportPlantDialog` (header de tabela), `ProjectTrackingTab` (badge de status), `ClientPortal` (badge), `ConstructionTasks` (header) — esses são contextuais e não são "dashboards".

### 5. KPIs separados — Aprovadas vs Faturamento

Já estão separados corretamente no código (linhas 185-186 e cards 321-343). `approvedCount` é COUNT, `faturamentoMes` é SUM. Nenhuma alteração necessária — a lógica já está correta.

### 6. Tipagem TypeScript — resolver `as any` críticos

**`useNotifications.ts`**: Remover `as any` nos `.insert()`, `.update()`, `.delete()` — usar tipagem correta do Supabase ou `as unknown as ...` com tipo explícito.

**`useInvoicesNF.ts`**: Substituir `from("invoices_nf" as any)` por tipagem adequada, e `as any[]` no retorno por tipo `InvoiceNF[]`.

**`DashboardEscritorio.tsx:212`**: `(p as any).projects?.name` → tipar o retorno do query com tipo inline `{ projects: { name: string } | null }`.

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/layout/AppSidebar.tsx` | localStorage para estado dos grupos |
| `src/App.css` | **Deletar** |
| `src/App.tsx` | QueryClient com staleTime/gcTime |
| `src/pages/DashboardEscritorio.tsx` | Remover emojis, tipar `projects` join |
| `src/pages/DashboardObras.tsx` | Remover emojis |
| `src/components/projects/ProjectOnboardingGuide.tsx` | Remover emoji |
| `src/hooks/useNotifications.ts` | Remover `as any` |
| `src/hooks/useInvoicesNF.ts` | Remover `as any` |

Nenhuma lógica de negócio alterada. Nenhuma rota alterada.

