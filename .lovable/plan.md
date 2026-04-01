

## Guia de Primeiros Passos na Aba Resumo

### Migration SQL

```sql
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS onboarding_dismissed boolean DEFAULT false;
```

### Novo componente: `src/components/projects/ProjectOnboardingGuide.tsx`

Componente de checklist visual com 6 etapas em timeline vertical.

**Props**: `project`, `onTabChange`, `onDismiss`

**Dados necessários** (queries dentro do componente):
- `useProjectActivities(projectId)` → count para etapas 2 e 6
- `useMaterialTracking(projectId)` → count para etapa 3
- `usePriceResearch(projectId)` → count para etapa 4

**Lógica de cada etapa**:
1. Importar proposta: `source_proposal_id && cotacao_importada === true`
2. Gerar atividades: `activities.length > 0`
3. Verificar materiais: `materials.length > 0`
4. Pesquisar preços: `priceResearch.length > 0`
5. Aprovar cotação: `cotacao_aprovada === true`
6. Montar cronograma: `activities.some(a => a.start_date)`

**Visual**:
- Timeline vertical com linha conectando os 6 passos
- Concluído: ícone `CheckCircle` verde, texto com opacity reduzida
- Próximo pendente: borda azul, CTA Button ativo, seta animada (pulse)
- Futuros: cinza, sem CTA
- Quando todos concluídos: mensagem de celebração (confetti/emoji) por 3s, depois auto-dismiss via `updateProject({ onboarding_dismissed: true })`

**Botão "Ocultar guia"**: Checkbox "Não mostrar novamente" + botão. Salva `onboarding_dismissed: true`.

### `src/components/projects/ProjectSummaryTab.tsx`

**Critério de exibição**: Renderizar `ProjectOnboardingGuide` antes dos KPI cards quando:
- `project.onboarding_dismissed !== true`
- `activities.length === 0 && cotacao_aprovada !== true && created_at > 7 dias atrás`

Usar `useProjectActivities` já disponível no contexto (ou importar). Passar `onTabChange` e `onDismiss` (que chama `updateProject`).

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | `onboarding_dismissed` em projects |
| `src/components/projects/ProjectOnboardingGuide.tsx` | **Novo** — checklist timeline 6 etapas |
| `src/components/projects/ProjectSummaryTab.tsx` | Renderizar guia condicionalmente no topo |

Nenhuma outra aba, rota ou funcionalidade alterada.

