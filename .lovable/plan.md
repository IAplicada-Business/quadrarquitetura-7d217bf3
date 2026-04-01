

## Integrar analyze-plant na Aba Escopo — Tab "Planta Baixa"

### 1. Atualizar Edge Function `analyze-plant`

Adicionar suporte a `mode = 'activities'` no request body. Quando `mode === 'activities'`:
- Aceitar campos opcionais `obra_type` e `ambientes`
- Usar prompt específico que retorna `{ ambientes: [{nome, area_m2_estimada}], atividades: [{name, discipline, area_m2, duration_days, ambiente_origem, depends_on_activity_name}] }`
- Tool call `extract_scope` com schema que inclui ambientes + atividades
- Manter o fluxo existente (sem `mode`) inalterado

### 2. Adicionar Tab "Planta Baixa" no `GenerateActivitiesDialog.tsx`

Nova quarta tab no `TabsList`:

**Inputs:**
- Upload de imagem (PNG/JPG/PDF) — reutilizar lógica existente de upload
- Select "Tipo de obra": reforma / construção / acabamento
- Textarea "Ambientes a considerar" (texto livre)
- Botão "Analisar Planta e Gerar Atividades"

**Ao clicar:** upload para storage → chamar `analyze-plant` com `mode: 'activities'`

**Resultado em duas colunas:**
- Esquerda: ambientes identificados (nome + área editável)
- Direita: atividades com checkbox, disciplina, duração (editáveis inline)

**Botão "Importar Selecionados":**
1. Cria atividades via `onCreate`
2. Dispara auto-cálculo de materiais (via `autoCalculateMaterials` já existente no hook)
3. Toast: "X atividades criadas. Y materiais calculados."

### 3. Novo state no dialog

```typescript
interface PlantAmbiente { nome: string; area_m2_estimada: number; }
interface PlantActivity extends GeneratedActivity { ambiente_origem?: string; depends_on_activity_name?: string; }

const [plantAmbientes, setPlantAmbientes] = useState<PlantAmbiente[] | null>(null);
const [plantActivities, setPlantActivities] = useState<PlantActivity[] | null>(null);
const [obraType, setObraType] = useState("reforma");
const [ambientesInput, setAmbientesInput] = useState("");
const [plantFile, setPlantFile] = useState<File | null>(null);
const [plantPreview, setPlantPreview] = useState<string | null>(null);
```

### 4. Auto-cálculo de materiais pós-importação

O `autoCalculateMaterials` já é chamado no `onSuccess` do `create` mutation em `useProjectActivities.ts`. Logo, ao chamar `onCreate` para cada atividade com `area_m2 > 0`, os materiais são calculados automaticamente. Apenas precisamos contar quantos materiais foram gerados para o toast — faremos isso consultando `material_tracking` após um delay curto, ou simplesmente exibindo o toast genérico.

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `supabase/functions/analyze-plant/index.ts` | Adicionar modo `activities` com prompt e schema específicos |
| `src/components/projects/GenerateActivitiesDialog.tsx` | Nova tab "Planta Baixa" com upload, resultado em 2 colunas, importação |
| `supabase/config.toml` | Adicionar `[functions.analyze-plant] verify_jwt = false` |

Nenhuma migration, rota ou outra aba alterada.

