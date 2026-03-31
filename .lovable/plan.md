

## Pesquisa de Preços em BH — Aba Cotações

### Nota sobre API de busca

O projeto usa Lovable AI (gateway) que não suporta Anthropic/Claude nem `web_search` nativo. Existem duas opções viáveis:

- **Perplexity** (conector disponível): busca web real com modelo `sonar`, retorna citações e fontes. Requer conectar o conector Perplexity ao projeto.
- **Lovable AI** (já configurado): gerar estimativas de preço baseadas em conhecimento do modelo (sem busca web real). Mais rápido de implementar, mas preços são estimativas, não dados live.

Recomendo **Perplexity** pela busca web real. Será necessário conectar o conector antes de implementar.

---

### 1. Migration — Tabela `price_research`

```sql
CREATE TABLE price_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE RESTRICT,
  activity_id uuid REFERENCES project_activities(id) ON DELETE CASCADE,
  material_name text,
  price_min numeric,
  price_max numeric,
  price_avg numeric GENERATED ALWAYS AS ((price_min + price_max) / 2) STORED,
  unit text,
  suppliers jsonb,
  searched_at timestamptz DEFAULT now(),
  user_id uuid
);
ALTER TABLE price_research ENABLE ROW LEVEL SECURITY;
-- RLS de equipe padrão (4 policies)
```

---

### 2. Edge Function `search-prices-bh`

- Recebe `{ activity_name, materials: [{name, unit, quantity}], city }`
- Para cada material, faz query ao Perplexity (ou Lovable AI) com prompt: `"preço [material] [unidade] distribuidora Belo Horizonte 2025"`
- Usa tool calling para extrair: `supplier, neighborhood, price_min, price_max, unit, source_url`
- Retorna array de resultados por material

---

### 3. Hook `usePriceResearch`

- Query: buscar pesquisas recentes (< 7 dias) por `activity_id`
- Mutation: salvar resultado na tabela

---

### 4. Componente `PriceSearchDialog`

Modal "Pesquisa de Preços — [Atividade]":
- Cards por material com faixa de preço (R$ X — R$ Y)
- Lista de fornecedores com bairro e contato
- Badge "Atualizado em [data]"
- Botão "Usar preço médio" → preenche valor na atividade
- Estado de loading com spinner durante pesquisa

---

### 5. Integração na aba Cotações (`ProjectBudgetsTab.tsx`)

- Importar `useProjectActivities` para listar atividades do projeto
- Abaixo da seção de disciplinas contratadas, adicionar seção **"Pesquisa de Preços por Atividade"**
- Para cada atividade com `area_m2 > 0`: card com botão "Pesquisar Preços em BH"
- Se já existe pesquisa recente (< 7 dias): mostrar botão "Ver última pesquisa" em vez de pesquisar novamente
- Cruzar atividade com `material_indices` para montar lista de materiais automaticamente

---

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Criar `price_research` + RLS |
| `supabase/functions/search-prices-bh/index.ts` | **Novo** — Edge Function de pesquisa |
| `supabase/config.toml` | Adicionar function entry |
| `src/hooks/usePriceResearch.ts` | **Novo** — CRUD hook |
| `src/components/projects/PriceSearchDialog.tsx` | **Novo** — Modal de resultados |
| `src/components/projects/ProjectBudgetsTab.tsx` | Adicionar seção de pesquisa por atividade |

Nenhuma outra aba ou rota alterada.

