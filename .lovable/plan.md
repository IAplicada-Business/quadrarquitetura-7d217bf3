

## Importar Planta com IA — Tarefas por Obra

### Contexto
Ativar o botão "Importar Planta" na página ConstructionTasks, implementando upload de planta, análise por IA via edge function, revisão editável dos resultados e criação em lote de `schedule_tasks`. Histórico salvo em nova tabela `plant_analyses`.

### Alterações

**1. Migration SQL** — 2 alterações:

```sql
-- Nova tabela para histórico de análises
CREATE TABLE plant_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  focus text NOT NULL,
  instructions text,
  ai_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE plant_analyses ENABLE ROW LEVEL SECURITY;
-- RLS: CRUD own records
CREATE POLICY "Users can insert own plant_analyses" ON plant_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own plant_analyses" ON plant_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plant_analyses" ON plant_analyses FOR DELETE USING (auth.uid() = user_id);

-- Coluna source na schedule_tasks para marcar origem
ALTER TABLE schedule_tasks ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
```

**2. Edge Function `supabase/functions/analyze-plant/index.ts`**:
- Recebe: `file_url`, `focus`, `instructions`
- Faz fetch da imagem/PDF do Storage
- Chama Lovable AI (`google/gemini-2.5-pro` — melhor para imagem+texto+raciocínio complexo) com prompt estruturado pedindo lista de atividades
- Usa tool calling para extrair JSON estruturado: `{ activities: [{ task_name, environment, discipline, quantity, unit, estimated_days }] }`
- Retorna o array de atividades
- Trata 429/402

**3. Novo componente `src/components/construction/ImportPlantDialog.tsx`**:
- Dialog modal com 3 steps internos (upload → loading → revisão)
- **Step 1**: Select de projeto, dropzone para upload (PDF/PNG/JPG, max 10MB), Select "Foco da análise" (11 opções), Textarea instruções adicionais, botão "Analisar com IA"
- Upload vai para bucket `project-files` via Supabase Storage
- **Step 2**: Spinner com "Analisando planta..."
- **Step 3**: Tabela editável com checkbox por linha, campos inline editáveis (task_name, environment, discipline, quantity, unit, estimated_days), botão "+ Adicionar atividade", rodapé "X selecionadas", botão "Criar atividades selecionadas"
- Ao criar: insere em `schedule_tasks` com `source = 'planta_ia'` e `status = 'planejado'`, salva registro em `plant_analyses`

**4. `src/pages/ConstructionTasks.tsx`**:
- Remover `disabled` e `opacity-50 cursor-not-allowed` do botão "Importar Planta"
- Alterar texto para "Importar Planta" (sem "em breve")
- Adicionar state `importPlantOpen` e renderizar `<ImportPlantDialog>`
- Na renderização de linhas da tabela: se `t.source === 'planta_ia'`, exibir Badge "via planta" com ícone Sparkles ao lado do nome da atividade

**5. `supabase/config.toml`** — adicionar:
```toml
[functions.analyze-plant]
verify_jwt = false
```

### Arquivos criados/editados
- 1 migration SQL (1 tabela + 1 coluna)
- 1 edge function criada: `analyze-plant/index.ts`
- 1 componente criado: `ImportPlantDialog.tsx`
- 1 arquivo editado: `ConstructionTasks.tsx`
- `config.toml` atualizado automaticamente
- Nenhuma aba, sub-aba ou rota alterada

