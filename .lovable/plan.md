

## Visão DRE — Projeto + Dashboard Escritório

### 1. Settings: campo `tax_rate_percent`

Nenhuma migration necessária — o `settings` já suporta campos arbitrários como JSON. Adicionar campo editável na aba "Geral" do `SettingsPage.tsx` com label "Alíquota de Impostos (%)" e default 6%.

### 2. Sub-aba "DRE" em `ProjectFinancialTab.tsx`

Adicionar uma quarta sub-aba `dre` no `TabsList` existente (Pagamentos | Notas Fiscais | Notas NF | **DRE**).

**Dados usados (sem novas queries)**:
- `payments.items` já carregados no componente — filtrar por `source` e inferir tipo (receita vs despesa pelo campo description/source)
- `purchases` do projeto via `useProjectPurchases(projectId)`
- `tax_rate` de `settings` via query simples

**Cálculo do DRE**:
```text
(+) Receita Honorários: payments.filter(source='escritorio')
(+) Receita Obra: payments.filter(source='obra', value > 0 onde descrição indica receita)
(=) RECEITA TOTAL

(-) Despesas Fornecedores: payments.filter(source='obra' ou 'cotacao', despesas)
(-) Compras: sum(purchases.value)
(=) RESULTADO BRUTO

(-) Impostos: receita_total * tax_rate / 100
(=) RESULTADO LÍQUIDO
    MARGEM % = resultado_líquido / receita_total * 100
```

**Visual**: Tabela vertical estilizada com linhas separadoras, valores e % ao lado. Badge colorida na margem (verde >20%, amarelo 10-20%, vermelho <10%).

**Exportar DRE**: Botão que gera PDF client-side via jsPDF com cabeçalho "Quadra Arquitetura", nome do projeto, período e tabela.

### 3. Dashboard Escritório — Seção "Resultado por Projeto"

Adicionar no `DashboardEscritorio.tsx`:

**Nova query**: Buscar todos os projetos ativos com seus payments e purchases para calcular DRE consolidado.

**KPI no topo** (novo card ao lado dos existentes ou como seção separada):
- "Margem Média do Escritório" — média ponderada das margens dos projetos ativos
- Sparkline dos últimos 6 meses usando Recharts `LineChart` compacto

**Tabela colapsável** no final do dashboard:
- Colunas: Projeto | Receita | Despesas | Margem R$ | Margem % | Status
- Ordenada por margem % decrescente
- Filtro de período: mês atual / trimestre / ano / personalizado (via Select)
- Badge colorida na margem

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/pages/SettingsPage.tsx` | Campo "Alíquota de Impostos (%)" na aba Geral |
| `src/components/projects/ProjectFinancialTab.tsx` | Sub-aba "DRE" com cálculo e exportação PDF |
| `src/pages/DashboardEscritorio.tsx` | KPI "Margem Média" + seção "Resultado por Projeto" colapsável |

Nenhuma migration, rota ou estrutura de tabela alterada.

