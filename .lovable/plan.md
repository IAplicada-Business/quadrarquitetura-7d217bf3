

## Estimativa Rápida de Orçamento — Aba Resumo

### Contexto
Adicionar calculadora de orçamento rápido na aba Resumo do projeto, abaixo dos dados gerais. Usa `area_sqm` (já existe), e precisa de `construction_type_estimate` (novo) e reutiliza `finish_level` com mapeamento para labels textuais.

### Alterações

**1. Migration SQL** — adicionar coluna `construction_type_estimate` na tabela `projects`:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS construction_type_estimate text;
```

O campo `area_sqm` já existe. O campo `finish_level` (integer 1-5) já existe — será mapeado para os 4 níveis (1=Básico, 2=Intermediário, 3=Alto Padrão, 4=Luxo).

**2. Tabela de referência de valores** — armazenada no campo `calculation_params` da tabela `settings` do usuário, sob a chave `cost_per_sqm_table`. Valores padrão iniciais:

```json
{
  "reforma_completa": { "basico": 1200, "intermediario": 2000, "alto_padrao": 3500, "luxo": 5500 },
  "reforma_parcial": { "basico": 800, "intermediario": 1400, "alto_padrao": 2500, "luxo": 4000 },
  "construcao": { "basico": 1500, "intermediario": 2500, "alto_padrao": 4000, "luxo": 6500 },
  "ampliacao": { "basico": 1000, "intermediario": 1800, "alto_padrao": 3000, "luxo": 5000 }
}
```

**3. Novo componente `src/components/projects/BudgetEstimator.tsx`**:
- Card com ícone Calculator no header, título "Estimativa Rápida de Orçamento"
- Campos: Área (m², pré-preenchido de `project.area_sqm`), Tipo de obra (Select), Nível de acabamento (Select), Valor por m² (auto-preenchido, editável)
- Resultado em destaque: valor estimado + faixa (±15%)
- Botão "Salvar como orçamento estimado" → `updateProject({ estimated_budget: valor })`
- Botão "Criar cenário a partir desta estimativa" → `onTabChange("cenarios")` (com valor no state)
- Collapsible "Detalhamento": nº ambientes, metragens por ambiente (campos opcionais, não persistidos por ora)
- Ao alterar área/tipo/nível, persiste no projeto via `updateProject`

**4. Hook `src/hooks/useCostReferenceTable.ts`**:
- Busca `settings` do usuário e extrai `calculation_params.cost_per_sqm_table`
- Se não existir, retorna os valores padrão hardcoded
- Mutation para salvar/atualizar a tabela

**5. `src/components/projects/ProjectSummaryTab.tsx`** — importar e renderizar `<BudgetEstimator>` após o card "Informações Gerais"

**6. `src/pages/SettingsPage.tsx`** — substituir o placeholder "Parâmetros de Cálculo" por editor funcional da tabela de custo por m². Grid editável 4×4 com inputs numéricos formatados em R$.

### Arquivos criados/editados
- 1 migration SQL (1 coluna)
- 2 arquivos criados: `BudgetEstimator.tsx`, `useCostReferenceTable.ts`
- 2 arquivos editados: `ProjectSummaryTab.tsx`, `SettingsPage.tsx`
- Nenhuma aba, sub-aba ou rota alterada

