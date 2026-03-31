

## Conversão automática de Lead → Cliente ao fechar

### Problema identificado

O fluxo de conversão lead→cliente **só funciona** no Pipeline (via drag-and-drop ou botão "Avançar" para "fechado"). Porém, no fluxo mais comum — aprovar proposta e criar contrato na página de detalhe do lead — o lead **não** é movido para "fechado" e o cliente **não** é criado automaticamente.

Há dois cenários onde a conversão falha:
1. **LeadDetail**: Ao aprovar proposta e criar contrato, o status do lead permanece inalterado e nenhum cliente é criado
2. **Edição direta**: Se o status for editado manualmente para "fechado" por qualquer via que não passe pelo `moveStatus`

### Solução

#### 1. LeadDetail.tsx — Converter lead ao criar contrato

No bloco `onClick` do `AlertDialogAction` (onde o contrato é criado a partir da proposta aprovada), adicionar após a criação do contrato:

- Chamar `convertToClient.mutate(lead)` do hook `useLeads` (que já cria o cliente e marca o lead como "fechado" com `converted_client_id`)
- Isso garante que aprovar proposta → criar contrato → lead vira cliente automaticamente

Alteração: importar `convertToClient` do `useLeads()` já disponível no componente, e chamá-lo dentro do bloco de sucesso da criação do contrato.

#### 2. useLeads.ts — Preencher `converted_at`

No `convertToClient` mutation, adicionar `converted_at: new Date().toISOString()` no update do lead junto com `converted_client_id` e `status: "fechado"`. Hoje esse campo existe na tabela mas nunca é preenchido.

### Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/pages/LeadDetail.tsx` | Chamar `convertToClient` ao criar contrato a partir de proposta aprovada |
| `src/hooks/useLeads.ts` | Adicionar `converted_at` no update do `convertToClient` |

### Sem alteração de banco

A tabela `leads` já possui a coluna `converted_at`. Nenhuma migration necessária.

