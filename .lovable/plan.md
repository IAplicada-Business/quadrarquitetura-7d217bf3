

## Corrigir erro "invalid input syntax for type uuid"

### Problema
Quando o usuário salva uma proposta sem selecionar um lead, `lead_id` é enviado como string vazia `""`, mas a coluna `lead_id` no banco é do tipo `uuid` e não aceita string vazia.

### Solução
Em `src/pages/LeadsProposals.tsx`, no `handleSave`, converter `lead_id` vazio para `null` antes de enviar ao banco.

### Edição: `src/pages/LeadsProposals.tsx`
- Linha 116: trocar `lead_id: formData.lead_id` por `lead_id: formData.lead_id || null`

