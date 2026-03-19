

## Atualizar prompt da edge function analyze-plant

### Contexto
Substituir o prompt atual (system + user) da edge function `analyze-plant` pelo prompt mais detalhado fornecido pelo usuário, que inclui instruções mais claras sobre formato de resposta e tratamento de estimativas.

### Alterações

**1. `supabase/functions/analyze-plant/index.ts`** — atualizar os prompts:

- **System prompt**: Usar o novo texto completo fornecido, com instruções sobre análise de plantas de arquitetura e construção civil, campos esperados (`activity_name` em vez de `task_name`, adição de `ponto` como unidade), e instrução sobre estimativas quando quantidade exata não for identificável.

- **User prompt**: Interpolação de `{focus}` e `{instructions}` no template fornecido.

- **Tool calling schema**: Atualizar o campo `task_name` para `activity_name` para alinhar com o novo prompt. Adicionar `ponto` como opção na description da unidade.

- **ImportPlantDialog.tsx**: Atualizar o mapeamento do resultado da IA para usar `activity_name` em vez de `task_name` ao popular a tabela de revisão e ao criar `schedule_tasks`.

### Arquivos editados
- `supabase/functions/analyze-plant/index.ts` (prompts + schema)
- `src/components/construction/ImportPlantDialog.tsx` (mapeamento de campos)
- Nenhuma aba, sub-aba ou rota alterada

