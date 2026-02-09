

# Fazer os Cards de Atalho funcionarem na aba Resumo

## Problema

Os 4 cards de atalho (Financeiro, Cronograma, Documentos, Diario de Obra) na aba Resumo nao funcionam. Os 3 primeiros renderizam como `<div>` sem acao, e "Diario de Obra" navega para `/construction/tracking` ao inves de abrir a aba "Acompanhamento" do proprio projeto.

## Solucao

Tornar o componente `Tabs` controlado em `ProjectDetail.tsx` e passar um callback `onTabChange` para `ProjectSummaryTab`, permitindo que os cards troquem a aba ativa.

---

## Alteracoes

### 1. `src/pages/ProjectDetail.tsx`

- Adicionar `useState` para controlar a aba ativa: `const [activeTab, setActiveTab] = useState("resumo")`
- Trocar `<Tabs defaultValue="resumo">` por `<Tabs value={activeTab} onValueChange={setActiveTab}>`
- Passar `onTabChange={setActiveTab}` como prop para `ProjectSummaryTab`

### 2. `src/components/projects/ProjectSummaryTab.tsx`

- Adicionar prop `onTabChange?: (tab: string) => void` na interface
- Alterar o "Diario de Obra" para apontar para a aba `acompanhamento` em vez de `/construction/tracking`
- Substituir os `<div>` e `<Link>` por botoes que chamam `onTabChange(href)` ao clicar
- Todos os 4 cards passam a usar o mesmo comportamento: chamar `onTabChange` com o valor da aba correspondente

### Mapeamento dos cards

| Card | Valor da aba |
|---|---|
| Financeiro | `financeiro` |
| Cronograma | `cronograma` |
| Documentos | `documentos` |
| Diario de Obra | `acompanhamento` |

