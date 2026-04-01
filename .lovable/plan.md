

## Correções Técnicas — 5 Itens

### 1. Formatação do Eixo Y nos Gráficos

Ambos dashboards já têm `formatCurrency` mas sem suporte a milhões. Substituir em ambos arquivos:

```typescript
const yAxisFormatter = (value: number) => {
  if (value >= 1000000) return `R$${(value/1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$${(value/1000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
};
```

- `DashboardEscritorio.tsx` linha 54: substituir `formatCurrency`
- `DashboardObras.tsx` linha 47: substituir `formatCurrency`
- Ambas `<YAxis tickFormatter>` já referenciam a função, só precisam apontar para `yAxisFormatter`

### 2. KPIs — Adicionar "Faturamento Fechado" + "Aprovadas no Mês"

O dashboard atual tem 4 KPIs: Leads, Conversão, Ticket Médio, Aguardando. Não há duplicação mas faltam as métricas pedidas. Solução:

- No `computed` (linha ~125), adicionar:
  - `approvedCount`: COUNT de proposals com `status='aprovada'` no mês
  - `faturamentoMes`: SUM de `price_full` das mesmas proposals
- Substituir os KPIs "Taxa de Conversão" e "Ticket Médio" por "Aprovadas no Mês" (contagem) e "Faturamento Fechado" (soma) — ou expandir para 6 KPIs em grid responsivo, mantendo todos

### 3. Tipagem TypeScript — Redução de `as any`

As tabelas `invoices_nf`, `project_activities`, `price_research`, etc. já têm tipos no `types.ts` auto-gerado. O problema real são casts em enums e inserts. Abordagem:

- Criar `src/types/database.ts` com interfaces extraídas para uso direto nos hooks (evitando imports longos do types.ts)
- Nos hooks principais (`useLeads.ts`, `useInvoicesNF.ts`, `useProjectActivities.ts`), substituir `as any` por casts tipados usando `Tables<'table_name'>` do Supabase
- Manter `as any` apenas onde necessário para enums do Postgres (ex: `client_type`)

### 4. Logo no Sidebar

Linha 109 em `AppSidebar.tsx`:
```html
<img src={logoLight} className="h-24 -mt-4 object-contain..." />
```
Substituir por:
```html
<img src={logoLight} className="h-14 object-contain object-left animate-fade-in" />
```
Ajustar container (linha 108) de `h-16` para `h-14 flex items-center` para centralizar sem hack de margin negativo.

### 5. Implementar Categorias de Fornecedores + Templates de Mensagem

**Categorias de Fornecedores**: Já existem como `supplier_categories: string[]` na tabela `settings`. Implementar:
- Componente `SupplierCategoriesManager` no SettingsPage (aba Geral): lista editável com add/remove de categorias de texto
- Usa o hook existente de settings para ler/salvar `supplier_categories`
- No formulário de fornecedores, popular o select de categoria a partir dessa lista

**Templates de Mensagem**: Usar `message_templates: jsonb` da tabela `settings`. Implementar:
- Componente `MessageTemplatesManager`: CRUD de templates com campos nome, tipo (WhatsApp/Email), corpo com variáveis `{{nome_cliente}}`, `{{projeto}}`
- Armazenar como array de objetos em `message_templates`
- Remover placeholder "em breve" de ambos

**Migration**: Nenhuma necessária — ambos campos já existem na tabela `settings`.

---

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/pages/DashboardEscritorio.tsx` | yAxisFormatter + KPIs faturamento/aprovadas |
| `src/pages/DashboardObras.tsx` | yAxisFormatter |
| `src/components/layout/AppSidebar.tsx` | Remover -mt-4, ajustar container logo |
| `src/types/database.ts` | **Novo** — interfaces tipadas para tabelas principais |
| `src/hooks/useLeads.ts` | Reduzir `as any` com tipos |
| `src/hooks/useInvoicesNF.ts` | Reduzir `as any` com tipos |
| `src/pages/SettingsPage.tsx` | Substituir placeholders por componentes reais |
| `src/components/settings/SupplierCategoriesManager.tsx` | **Novo** — CRUD categorias |
| `src/components/settings/MessageTemplatesManager.tsx` | **Novo** — CRUD templates |

Nenhuma rota ou migration adicionada.

