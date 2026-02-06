

# Dashboard Dividido: Escritorio + Obras

## Resumo

Separar o Dashboard atual em duas visoes independentes: **Dashboard Escritorio** (administrativo/financeiro) e **Dashboard Obras** (operacional). Cada um tera identidade visual propria (rosa para escritorio, azul para obras) e conteudo relevante para cada contexto. A navegacao sera atualizada para refletir essas duas entradas.

---

## O Que Sera Feito

### 1. Navegacao Atualizada no Sidebar

O grupo "Principal" do menu lateral passara a ter dois itens:

- **Escritorio** (`/dashboard/escritorio`)
- **Obras** (`/dashboard/obras`)

A rota `/dashboard` redirecionara automaticamente para `/dashboard/escritorio`.

### 2. Dashboard Escritorio (Rosa/Administrativo)

Pagina com paleta rosa suave, pensada para Camilla e Mari verem a saude financeira do escritorio.

**Cards de resumo:**
- Fluxo de Caixa (receitas vs despesas)
- Pagamentos Pendentes (valor total + quantidade)
- Total Orcado vs Recebido vs A Receber
- Projetos Ativos

**Graficos:**
- Area Chart: Fluxo de Pagamentos por mes (recebido vs pendente)
- Pie Chart: Orcamentos por status (pendente, em cotacao, aprovado, rejeitado)
- Bar Chart: Receitas vs Despesas por mes

**Secoes adicionais:**
- Alertas priorizados (pagamentos vencidos, orcamentos pendentes de resposta)
- Pipeline de leads / projetos recentes com status
- Pagamentos da semana (lista com fornecedor, projeto, valor, data)

### 3. Dashboard Obras (Azul/Operacional)

Pagina com paleta azul (ja existente no sistema), pensada para Mari e equipe de campo.

**Cards de resumo:**
- Obras em Execucao
- Pendencias Abertas (total)
- Compras Pendentes
- Proximas Etapas da Semana

**Graficos e visualizacoes:**
- Progresso dos projetos ativos (barras de progresso com %)
- Cronograma semanal consolidado (quem esta onde)

**Secoes adicionais:**
- Agenda de visitas a obra (rituais: segunda abre, sexta fecha)
- Pendencias por obra (lista agrupada)
- Compras e materiais pendentes
- Proximas etapas por projeto

### 4. Identidade Visual Diferenciada

Cada dashboard tera uma classe CSS aplicada na raiz que altera sutilmente a paleta de cores:

- **Escritorio**: Cards e destaques usarao tons de rosa (`hsl(350, ...)`) nos indicadores, bordas e fills dos graficos
- **Obras**: Cards e destaques usarao tons de azul (`hsl(209, ...)` - a cor primaria ja existente)

Isso sera feito via CSS variables locais ou classes condicionais nos componentes, sem alterar o design system global.

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/pages/DashboardEscritorio.tsx` — Dashboard administrativo completo
- `src/pages/DashboardObras.tsx` — Dashboard operacional completo

### Arquivos a modificar:

**`src/App.tsx`**
- Adicionar rotas `/dashboard/escritorio` e `/dashboard/obras`
- Redirecionar `/dashboard` para `/dashboard/escritorio`
- Importar os dois novos componentes

**`src/components/layout/AppSidebar.tsx`**
- Alterar grupo "Principal" para ter dois itens: "Escritorio" e "Obras"

**`src/pages/Dashboard.tsx`**
- Sera substituido pelo redirecionamento, podendo ser removido ou mantido como redirect

### Estrutura dos novos componentes:

Ambos os dashboards usarao dados mockados (nesta fase) com os mesmos componentes de UI ja existentes:
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`
- `Badge`, `Progress`
- `ChartContainer`, `AreaChart`, `PieChart`, `BarChart` (recharts)

### Paleta de cores (aplicada via classes inline):

```text
Escritorio (Rosa):
  - Cor destaque: hsl(350, 65%, 55%) — rosa medio
  - Cor de fundo suave: hsl(350, 30%, 96%) — rosa palido
  - Fills de graficos: tons de rosa e coral
  - Texto destaque: hsl(350, 25%, 35%)

Obras (Azul):
  - Cor destaque: hsl(209, 59%, 30%) — azul primario existente
  - Cor de fundo suave: hsl(209, 30%, 96%) — azul palido
  - Fills de graficos: tons de azul e ciano
  - Texto destaque: hsl(209, 50%, 25%)
```

### Dados mockados:

Todos os dados serao arrays/objetos mock dentro de cada componente (mesmo padrao do Dashboard atual), sem conexao ao banco nesta fase. Isso sera conectado ao Supabase em uma fase futura.

---

## Resultado Esperado

- Menu lateral com duas entradas claras: "Escritorio" e "Obras"
- Cada dashboard com visual e conteudo distintos
- Navegacao fluida entre os dois
- Dados mockados realistas demonstrando o layout completo
- Design system mantido (fontes, cards, bordas, animacoes)

