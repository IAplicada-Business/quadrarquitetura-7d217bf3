

## Adicionar seção "Configurações do Cronograma" ao ConstructionTaskForm

### O que será feito
Adicionar uma seção colapsável abaixo de "Materiais Associados" (linha 399) e acima de "Observações" (linha 401) com 5 campos que já existem na tabela `schedule_tasks`.

### Alterações no arquivo `src/components/construction/ConstructionTaskForm.tsx`

**1. Novos estados (após linha 78):**
- `isClientVisible` (boolean, default false)
- `isDailyDetail` (boolean, default false)
- `requiresPresence` (boolean, default false)
- `color` (string, default "")
- `orderIndex` (string, default "")
- `scheduleOpen` (boolean, default false)

**2. Inicialização no useEffect (após linha 100):**
- Ler `is_client_visible`, `is_daily_detail`, `requires_presence`, `color`, `order_index` do `initialData`

**3. Inclusão no handleSubmit (após linha 189):**
- Adicionar os 5 campos ao objeto `data`

**4. Nova seção colapsável no JSX (entre Materiais e Observações, linhas 399-401):**
- Collapsible "Configurações do Cronograma" com:
  - Checkbox "Visível para o cliente" → `is_client_visible`
  - Checkbox "Detalhe diário" → `is_daily_detail`
  - Checkbox "Requer presença na obra" → `requires_presence`
  - Select de cores predefinidas (palette de disciplinas) → `color`
  - Input numérico "Ordem de exibição" → `order_index`

**5. Import adicional:**
- Adicionar `Settings` (lucide) para ícone da seção

Nenhuma aba, sub-aba ou rota será alterada.

