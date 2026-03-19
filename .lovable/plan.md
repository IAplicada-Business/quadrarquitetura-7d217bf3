

## ALTERAÇÃO 4 — Conexão Atividade → Cronograma (Gantt automático)

### Resumo
Reestruturar o Gantt para ser gerado automaticamente a partir das atividades cadastradas. Adicionar visão "dia" ao toggle, colorir barras por disciplina, renderizar setas de dependência, e transformar a Visão Cliente em blocos semanais agrupados por disciplina com exportação PDF.

---

### 1. Atualizar `GanttChart.tsx` — Gantt Interno completo

**Novas props:**
- `viewMode: "day" | "week" | "month"` (adicionar "day")
- `dependencies` passadas junto com cada task (array de IDs)
- Adicionar filtros por disciplina, fornecedor, ambiente (recebidos como props ou estado interno)

**Colorir barras por disciplina:**
- Criar mapa de cores por disciplina (16 disciplinas → 16 cores distintas). Usar `task.color` como override; fallback para cor da disciplina.

**Setas de dependência:**
- Após renderizar todas as barras, usar SVG overlay para desenhar setas entre barras conectadas por `dependencies[]`.
- Calcular posição Y (índice da linha × altura da linha) e posição X (coluna do end_date da dependência → coluna do start_date da tarefa).
- Seta simples: linha horizontal + vertical + ponta de seta.

**Barras clicáveis:**
- A barra já chama `onEdit` no botão de edição. Tornar a própria barra clicável via `onClick={() => onEdit?.(task)}` com `cursor-pointer`.

**Visão "dia":**
- Similar a "week" mas mostrando exatamente 1 dia com divisão por horas (ou mantendo granularidade diária com 14 dias visíveis para contexto).
- Implementar como: 14 dias centrados no dia atual.

### 2. Atualizar `ProjectScheduleTab.tsx` — Filtros e toggle

**Toggle de visualização:** dia / semana / mês (já tem semana/mês, adicionar dia).

**Filtros adicionais** (acima do Gantt):
- Por Disciplina (já existe, manter)
- Por Fornecedor (novo Select)
- Por Ambiente (novo Select)
- Extrair opções únicas dos `items` carregados.

**Passar `dependencies` e `allTasks`** para o GanttChart para renderizar setas.

### 3. Reestruturar `ClientScheduleView.tsx` — Visão Simplificada

**Agrupamento por disciplina em blocos semanais:**
- Em vez de listar tarefas individuais, agrupar por semana e mostrar disciplinas ativas naquela semana.
- Ex: "Semana 1-2: Automação e Elétrica", "Semana 3: Gesso/Forro"

**Exportar como PDF:**
- Botão "Exportar PDF" que usa `html2canvas` + `jsPDF` (ou window.print com CSS @media print) para gerar PDF.
- Visual limpo com cores da Quadra (azul escuro #1F4E79, rosa suave).

**Botão "Copiar como imagem"** para envio via WhatsApp (usando html2canvas para gerar PNG).

### 4. Mapa de cores por disciplina

```text
Alvenaria     → #8B5E3C (marrom)
Elétrica      → #F59E0B (amarelo)
Hidráulica    → #3B82F6 (azul)
Pintura       → #EC4899 (rosa)
Acabamento    → #8B5CF6 (roxo)
Demolição     → #EF4444 (vermelho)
Estrutura     → #6B7280 (cinza)
Impermeab.    → #06B6D4 (ciano)
Esquadrias    → #14B8A6 (teal)
Automação     → #6366F1 (indigo)
Ar-condic.    → #0EA5E9 (sky)
Gesso/Forro   → #D4D4D8 (zinc claro)
Revestimento  → #A855F7 (violet)
Marcenaria    → #92400E (amber escuro)
Piso          → #78716C (stone)
Outros        → #9CA3AF (gray)
```

### Detalhes técnicos

- **Dependências no Gantt**: Cada task recebe `dependencies: string[]` (já existe no DB). O GanttChart faz lookup por ID para encontrar a posição da barra dependente e renderiza SVG.
- **PDF export**: Usar `window.print()` com CSS `@media print` dedicado na ClientScheduleView (evita dependência extra). Alternativa: instalar `html2canvas` se necessário para imagem WhatsApp.
- **Nenhuma migração necessária** — os campos `dependencies`, `environment`, `discipline` já existem.
- **Nenhuma rota, aba ou navegação será removida.**
- Arquivos editados: `GanttChart.tsx`, `ProjectScheduleTab.tsx`, `ClientScheduleView.tsx`

