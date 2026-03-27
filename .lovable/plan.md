

## Adicionar `lead_id` nos contratos + seção "Contratos" na página de detalhe do lead

### 1. Migration SQL

```sql
-- Adicionar coluna
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE RESTRICT;

-- Backfill retroativo
UPDATE public.contracts c
SET lead_id = p.lead_id
FROM public.proposals p
WHERE c.proposal_id = p.id
AND c.lead_id IS NULL;
```

### 2. Fluxo de conversão — preencher `lead_id`

Nos dois locais onde contratos são criados a partir de propostas:

**`src/pages/LeadsProposals.tsx`** (linha ~549): adicionar `lead_id: convertProposal.lead_id || null` no insert.

**`src/pages/LeadDetail.tsx`** (linha ~343): adicionar `lead_id: convertProposal.lead_id || lead?.id || null` no insert.

### 3. Seção "Contratos" em `LeadDetail.tsx`

Após a seção de Propostas, adicionar um novo `<Card>` com:
- Query: `supabase.from("contracts").select("*").eq("lead_id", id)` com queryKey `["contracts", "by-lead", id]`
- Tabela com colunas: Projeto (`title`), Data (`created_at` formatada), Status (badge), Ações (botão "Editar" → navega para `/leads/contracts` com state `editContractId`)
- Estado vazio: "Nenhum contrato vinculado a este lead."
- Cores de status dos contratos: rascunho=cinza, enviado=azul, assinado=verde, cancelado=vermelho

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar coluna `lead_id` + backfill |
| `LeadsProposals.tsx` | Adicionar `lead_id` no insert do contrato |
| `LeadDetail.tsx` | Adicionar `lead_id` no insert + nova seção "Contratos" |

