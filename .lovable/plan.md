

## Gerar Atividades com IA — Escopo do Projeto

### Visão geral

Substituir o placeholder "Em breve" do botão "Gerar com IA" na aba Escopo por um modal completo com 3 modos de entrada (texto, áudio, foto), chamando uma nova Edge Function `generate-activities` que usa Lovable AI para gerar atividades estruturadas.

---

### 1. Edge Function `supabase/functions/generate-activities/index.ts`

- Recebe `{ project_id, mode, content }` onde mode é `"text"`, `"audio"` ou `"image"`
- Para mode `"text"`: content é a descrição em texto livre
- Para mode `"audio"`: content é a transcrição já feita no frontend
- Para mode `"image"`: content é a URL pública da imagem (reutiliza padrão do analyze-plant)
- Usa tool calling (structured output) para garantir resposta JSON:

```
Tool: generate_activities_list
Parameters: { activities: [{ name, discipline, area_m2, duration_days, description }] }
```

- Prompt do sistema conforme especificado (assistente de gestão de obra em BH)
- Para imagem: envia como `image_url` no content array (mesmo padrão do analyze-plant)
- Trata 429/402 com mensagens amigáveis
- Adicionar ao `config.toml`: `[functions.generate-activities]` com `verify_jwt = false`

---

### 2. Novo componente `src/components/projects/GenerateActivitiesDialog.tsx`

Modal com 3 tabs internas:

**Tab "Texto"**: Textarea para descrição livre do projeto

**Tab "Áudio"**: Reutiliza o componente `VoiceChat` (de `ia-siri-chat.tsx`) já existente para gravação e transcrição. Ao obter transcrição, preenche automaticamente o campo de texto.

**Tab "Foto"**: Upload de imagem (PNG/JPG, max 10MB), faz upload ao storage `project-files`, obtém URL pública, envia como mode `"image"`.

**Botão "Gerar Lista"**: Chama `supabase.functions.invoke("generate-activities", { body })`.

**Após geração**: Exibe lista de atividades com:
- Checkbox ao lado de cada uma (todas selecionadas por padrão)
- Nome editável inline (Input)
- Duração editável inline (Input number)
- Disciplina (badge, não editável inline)
- Área m² (texto)

**Botão "Adicionar Selecionadas"**: Insere as marcadas em `project_activities` via `create.mutate()` com `status: 'pendente'` e `position` sequencial (baseado no count atual de activities).

---

### 3. Atualizar `ProjectScopeTab.tsx`

- Substituir o Dialog placeholder (linhas 199-211) pelo novo `GenerateActivitiesDialog`
- Passar `projectId`, `activities` (para calcular position), e `create` mutation

---

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/generate-activities/index.ts` | **Novo** — Edge Function com Lovable AI |
| `supabase/config.toml` | Adicionar `[functions.generate-activities]` |
| `src/components/projects/GenerateActivitiesDialog.tsx` | **Novo** — Modal com 3 tabs + revisão |
| `src/components/projects/ProjectScopeTab.tsx` | Trocar placeholder pelo novo dialog |

Nenhuma rota ou funcionalidade existente alterada.

