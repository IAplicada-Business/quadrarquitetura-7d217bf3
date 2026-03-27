

## Drag-and-drop no Kanban + Aba de Análise de Leads

### 1. Drag-and-drop no Kanban (LeadsPipeline.tsx)

Implementar arrastar cards entre colunas usando a HTML5 Drag and Drop API nativa (sem biblioteca externa):

- Cada card recebe `draggable`, `onDragStart` (guarda `lead.id` no state)
- Cada coluna recebe `onDragOver` (preventDefault) e `onDrop` (lê o lead arrastado e chama `update.mutate({ id, status: novoStatus })`)
- Visual: coluna alvo ganha borda pontilhada azul durante o drag (`onDragEnter`/`onDragLeave`)
- Se dropar em "fechado" e lead não tem `converted_client_id`, dispara `convertToClient` (mesmo comportamento do botão "Avançar")
- Card sendo arrastado recebe `opacity-50`

### 2. Aba "Análise" na página de Pipeline

Adicionar uma terceira view nas Tabs existentes (kanban | tabela | **analise**) com ícone `BarChart3`:

**Métricas de conversão:**
- Funil visual: barra horizontal empilhada mostrando quantos leads em cada etapa
- Taxa de conversão por etapa (novo→contato, contato→reunião, etc.)
- Taxa geral de conversão (fechados / total)
- Tempo médio no pipeline (dias entre `created_at` e `updated_at` dos fechados)

**Métricas por origem:**
- Tabela: origem × total leads × fechados × taxa de conversão
- Destaque visual na origem com melhor taxa

**Métricas por tipo de projeto:**
- Mesmo formato: tipo × total × fechados × taxa

**Métricas temporais:**
- Leads criados por mês (últimos 6 meses) — barra simples com divs proporcionais
- Leads perdidos por motivo (se `lost_reason` preenchido)

Tudo calculado client-side a partir dos leads já carregados — sem query adicional.

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/LeadsPipeline.tsx` | Adicionar drag-and-drop handlers no Kanban + nova view "analise" com painel de métricas |

