

## Botão "Enviar por E-mail" com Edge Function usando Resend

### Resumo
Adicionar botão "Enviar por E-mail" no formulário de proposta. O fluxo gera o PDF A4, converte para base64, e envia via Edge Function `send-proposal-email` usando Resend com o PDF como anexo.

### Pré-requisito: API Key do Resend
O projeto não tem uma chave Resend configurada. Será necessário solicitar a secret `RESEND_API_KEY` antes de prosseguir com a implementação.

### Edições

**1. Edge Function `supabase/functions/send-proposal-email/index.ts`**
- Receber `{ proposta_id, destinatario_email, destinatario_nome, pdf_base64, projeto_nome }`
- Usar Resend API (`https://api.resend.com/emails`) com `RESEND_API_KEY`
- Assunto: `Proposta Quadra Arquitetura — ${projeto_nome}`
- Corpo HTML com saudação personalizada + mensagem padrão
- Anexo: `{ filename: "proposta-quadra.pdf", content: pdf_base64 }` como application/pdf
- CORS headers padrão

**2. `src/components/leads/ProposalFormNew.tsx`**
- Adicionar prop `onSendEmail?: (data: ProposalFormData) => void`
- Adicionar botão "Enviar por E-mail" (ícone `Send`) ao lado dos botões existentes, condicionado a `onSendEmail`
- Desabilitado durante `saving`

**3. `src/pages/LeadsProposals.tsx`**
- Criar `handleSendEmail(formData)`:
  - Buscar lead associado via `formData.lead_id` no array `leads` (já carregado)
  - Validar que lead tem email; se não, toast de erro
  - Gerar PDF A4 (reutilizar lógica de `handleGeneratePdf`)
  - Converter blob → base64 via `FileReader.readAsDataURL`
  - Chamar `supabase.functions.invoke("send-proposal-email", { body: { ... } })`
  - Toast de sucesso com email enviado ou toast de erro
- Passar `onSendEmail={handleSendEmail}` ao `ProposalFormNew`

**4. `supabase/config.toml`**
- Adicionar bloco `[functions.send-proposal-email]` com `verify_jwt = false`

### Fluxo do usuário
1. Preenche proposta normalmente
2. Clica "Enviar por E-mail"
3. PDF é gerado em background (mesmo fluxo do "Gerar PDF")
4. PDF convertido para base64
5. Edge Function envia via Resend com anexo
6. Toast confirma envio com email do destinatário

### Arquivos

| Arquivo | Ação |
|---|---|
| Secret `RESEND_API_KEY` | Solicitar ao usuário |
| `supabase/functions/send-proposal-email/index.ts` | Nova Edge Function |
| `supabase/config.toml` | Adicionar config da função |
| `ProposalFormNew.tsx` | Nova prop + botão |
| `LeadsProposals.tsx` | Handler de envio por email |

