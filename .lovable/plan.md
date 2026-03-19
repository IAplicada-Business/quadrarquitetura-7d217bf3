

## Gerador de Propostas PDF — Plano de Implementação

### Contexto
Reestruturar o módulo Leads > Propostas para gerar PDFs multi-página (landscape 16:9) com identidade visual completa da Quadra, baseado no design do PDF anexado. Sistema de 33 páginas com conteúdo fixo, semi-dinâmico e dinâmico.

Devido ao escopo (maior feature do projeto), a implementação será dividida em **4 fases sequenciais**.

---

### FASE 1 — Infraestrutura (DB + Storage + Settings)

**Migration SQL** — Novos campos na tabela `proposals`:
```
client_name, project_name, scope_description, services_included,
timeline_briefing (int default 4), timeline_study (int default 15),
timeline_priorities (int default 7), timeline_construction (int default 25),
price_full (numeric), price_cash (numeric), installments_count (int),
installment_entry (numeric), installment_value (numeric), price_note (text),
portfolio_projects (jsonb), feedback_items (jsonb), pdf_url (text)
```

**Nova tabela `proposal_assets`**:
```sql
id uuid PK, user_id uuid, category text (logo/founder_photo/portfolio/feedback/contact),
name text, description text, file_url text, project_name text, project_category text,
display_order int, is_active boolean default true, metadata jsonb, created_at, updated_at
```
RLS: CRUD por `user_id` autenticado.

**Storage**: Criar bucket `proposal-assets` (público) para logos, fotos de sócias, portfólio e feedbacks.

**Nova aba em Settings**: "Proposta" — CRUD de assets organizados por categoria:
- Upload de logo
- Upload de fotos das sócias (nome + formação editáveis)
- Upload de portfólio (agrupado por projeto, com nome e categoria)
- Upload de feedbacks (prints de WhatsApp)
- Edição de textos fixos (Quem Somos, bullets dos 6 pilares, diferenciais)
- Edição de contato (Instagram, telefones)

**Arquivos**:
- 1 migration SQL
- `src/hooks/useProposalAssets.ts` — CRUD hook
- `src/components/settings/ProposalBrandingTab.tsx` — UI de gerenciamento
- `src/pages/SettingsPage.tsx` — adicionar aba "Proposta"

---

### FASE 2 — Formulário de Proposta Reestruturado

Substituir o formulário atual no Dialog por um novo com 6 seções:

1. **Dados do Cliente**: nome, nome do projeto, tipo (residencial/comercial/saúde), vinculação a lead
2. **Escopo**: textarea com texto padrão editável, checkboxes de serviços
3. **Prazos**: briefing, estudo, prioridades, obra (com defaults)
4. **Valores**: valor cheio, à vista, parcelas (cálculo automático de valor parcela)
5. **Portfólio e Feedbacks**: checkboxes para selecionar assets cadastrados em Settings
6. **Ações**: Preview, Gerar PDF, Salvar rascunho

**Arquivos**:
- `src/components/leads/ProposalFormNew.tsx` — formulário completo em seções
- `src/pages/LeadsProposals.tsx` — trocar Dialog por novo formulário (preservar lista e templates)
- `src/hooks/useProposals.ts` — expandir mutations para novos campos

---

### FASE 3 — Renderizador de Páginas da Proposta

Criar componentes React para cada tipo de página, renderizados em container 1456x816px:

| Componente | Páginas | Tipo |
|---|---|---|
| `ProposalCoverPage` | 1 | dinâmica |
| `ProposalAboutPage` | 2 | fixa (dados de Settings) |
| `ProposalScopePage` | 3 | dinâmica |
| `ProposalFlowPage` | 4 | semi-dinâmica |
| `ProposalManagementPage` | 5 | fixa |
| `ProposalPillarPage` | 6-11 | fixa (6 instâncias, 1 por pilar) |
| `ProposalPortfolioPage` | 12-20 | semi-dinâmica (selecionáveis) |
| `ProposalWhyHirePage` | 21 | fixa |
| `ProposalWorksSeparator` | 22 | fixa |
| `ProposalWorksPage` | 23-26 | fixa (fotos de Settings) |
| `ProposalFeedbackSeparator` | 27 | fixa |
| `ProposalFeedbackPage` | 28-31 | semi-dinâmica (selecionáveis) |
| `ProposalValuesPage` | 32 | dinâmica |
| `ProposalContactPage` | 33 | semi-fixa |

Cada componente recebe props tipadas e renderiza com a paleta exata:
- `#1B2A4A` (azul-marinho), `#F5E0D0` (bege), `#9B6B7B` (rose-mauve)
- `#F0DCC8` (texto claro), `#8B4557` (títulos vinho), `#C4756E` (linha destaque), `#D4B8A0` (shapes)

Shapes decorativos via CSS clip-path (polígono angular no canto inferior).
Ícones dos pilares via Lucide React (Clock, DollarSign, ShoppingBag, BadgeCheck, CalendarCheck, MapPin).

**Arquivos**:
- `src/components/leads/proposal-pages/` — 14+ componentes de página
- `src/components/leads/ProposalPageRenderer.tsx` — orquestrador que monta array de páginas

---

### FASE 4 — Preview + Geração PDF

**Preview Modal**: Modal fullscreen com navegação entre páginas (setas + thumbnails laterais). Cada página renderizada no container 1456x816 com scroll.

**Geração PDF**: Usar `html2canvas` + `jsPDF`:
1. Para cada página React, renderizar em DOM oculto (1456x816)
2. `html2canvas` captura como imagem em alta resolução (scale: 2)
3. `jsPDF` em landscape, adiciona cada imagem como página
4. Upload do PDF para bucket `proposal-assets` no Storage
5. Salva URL em `proposals.pdf_url`

Dependências novas: `html2canvas`, `jspdf` (ambas disponíveis via npm).

**Arquivos**:
- `src/components/leads/ProposalPreviewModal.tsx` — preview navegável
- `src/lib/generateProposalPdf.ts` — lógica de geração PDF
- `src/components/leads/ProposalPreview.tsx` — manter existente para compatibilidade, mas o novo fluxo usa o modal

---

### Resumo de arquivos

| Ação | Arquivo |
|---|---|
| Migration | 1 SQL (alter proposals + create proposal_assets + storage bucket) |
| Criar | `src/hooks/useProposalAssets.ts` |
| Criar | `src/components/settings/ProposalBrandingTab.tsx` |
| Criar | `src/components/leads/ProposalFormNew.tsx` |
| Criar | `src/components/leads/proposal-pages/*.tsx` (14 componentes) |
| Criar | `src/components/leads/ProposalPageRenderer.tsx` |
| Criar | `src/components/leads/ProposalPreviewModal.tsx` |
| Criar | `src/lib/generateProposalPdf.ts` |
| Editar | `src/pages/SettingsPage.tsx` (nova aba) |
| Editar | `src/pages/LeadsProposals.tsx` (novo formulário) |
| Editar | `src/hooks/useProposals.ts` (novos campos) |

Nenhuma aba, sub-aba ou rota existente alterada.

