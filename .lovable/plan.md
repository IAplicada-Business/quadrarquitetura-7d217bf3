

## Conversão de proposta aprovada em contrato

### Resumo
Substituir o toast placeholder do botão "Aprovar" por um modal de confirmação. Ao confirmar, criar contrato pré-preenchido com dados da proposta e redirecionar para `/leads/contracts` com o formulário de edição aberto.

### Mapeamento de campos (proposta → contrato)

| Proposta | Contrato |
|---|---|
| `id` | `proposal_id` |
| `leads.name` | `client_name` |
| `leads.email` | `client_email` |
| `leads.phone` | `client_phone` |
| `price_full` | `value` |
| `payment_conditions` | `payment_conditions` |
| `scope_description` | `service_description` |
| `valid_until` | `start_date` |
| `project_name` | `title` |
| `estimated_duration` | `estimated_duration` |
| — | `status = "rascunho"` |

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/LeadsProposals.tsx` | Substituir toast por AlertDialog de confirmação; ao confirmar, inserir contrato via `useContracts().create` e redirecionar |
| `src/pages/LeadDetail.tsx` | Mesma lógica para o botão Aprovar (se existir) |

### Detalhes técnicos

**1. `src/pages/LeadsProposals.tsx`**
- Importar `useContracts` e `AlertDialog` components
- Adicionar state: `convertProposalId: string | null`
- No botão "Aprovar" (linha ~483): após `update.mutate`, setar `convertProposalId = p.id` em vez de exibir toast
- Renderizar `AlertDialog` controlado por `convertProposalId`:
  - Título: "Proposta aprovada"
  - Descrição: "Deseja converter em contrato?"
  - Botão "Converter em Contrato": executa insert no contracts via supabase direto (não via hook, para obter o id de retorno), mapeia campos conforme tabela acima, gera `contract_number` com helper existente, depois navega para `/leads/contracts` com state `{ editContractId: newContract.id }` e toast "Contrato criado a partir da proposta. Revise antes de enviar."
  - Botão "Depois": fecha o dialog

**2. `src/pages/LeadsContracts.tsx`**
- No `useEffect` ou inicialização, verificar `location.state?.editContractId`
- Se presente, encontrar o contrato e chamar `openEdit(contract)` automaticamente
- Campos não preenchidos pela proposta (CPF/CNPJ, endereço do contratante, endereço da obra, bairro, cidade) ficam vazios — o formulário já aceita isso normalmente

**3. `src/pages/LeadDetail.tsx`**
- Se houver botão de aprovação na listagem de propostas, aplicar a mesma lógica de conversão

### Fluxo do usuário
1. Clica "Aprovar" numa proposta enviada
2. Status muda para "aprovada"
3. Modal aparece: "Deseja converter em contrato?"
4. Ao confirmar → contrato criado → redirecionado para `/leads/contracts` com formulário de edição aberto
5. Campos pendentes ficam vazios para preenchimento manual

