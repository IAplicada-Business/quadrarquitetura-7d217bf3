

## Plano: Sistema de Mensagens Padrão com Envio via WhatsApp

### 1. Migration — Criar tabela `message_templates`
```sql
CREATE TABLE message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text DEFAULT 'whatsapp' CHECK (type IN ('whatsapp','email')),
  category text CHECK (category IN ('lead','proposta','contrato','obra','financeiro','geral')),
  body text NOT NULL,
  variables text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view message_templates" ON message_templates
  FOR SELECT TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can create message_templates" ON message_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can update message_templates" ON message_templates
  FOR UPDATE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
CREATE POLICY "Team can delete message_templates" ON message_templates
  FOR DELETE TO authenticated USING (user_id IN (SELECT get_team_user_ids()));
```

### 2. Insert — Templates base (via insert tool)
5 templates iniciais conforme especificado (Proposta enviada, Contrato assinado, Atualização semanal, Pagamento próximo, Reunião confirmada).

### 3. Hook `src/hooks/useMessageTemplates.ts`
- CRUD completo para `message_templates` com `useQuery` + `useMutation`
- Filtro por `category` opcional
- Export de tipos

### 4. Componente `src/components/messages/SendMessageModal.tsx`
- Props: `category`, `context` (objeto com variáveis disponíveis), `phone`, `open/onOpenChange`
- Select de template filtrado por categoria
- Preview com variáveis interpoladas em tempo real (highlight nas variáveis com cor)
- Campo telefone pré-preenchido
- Botão "Abrir no WhatsApp" → `window.open('https://wa.me/55' + phone.replace(/\D/g,'') + '?text=' + encodeURIComponent(text))`
- Botão "Copiar texto"

### 5. Componente `src/components/settings/MessageTemplatesSettings.tsx`
- Substituir o `MessageTemplatesManager` existente (client-side/settings JSON)
- CRUD usando hook `useMessageTemplates` (banco)
- Listar templates com badge de categoria e tipo
- Preview com variáveis destacadas

### 6. Integração — Botão "Enviar Mensagem" nos contextos

| Local | Arquivo | Categoria |
|-------|---------|-----------|
| Card de lead no pipeline | `LeadsPipeline.tsx` | `lead`, `proposta` |
| Detalhe do lead | `LeadDetail.tsx` | `lead`, `proposta` |
| Card de contrato | `LeadsContracts.tsx` | `contrato` |
| Aba Acompanhamento do projeto | `ProjectTrackingTab.tsx` | `obra` |
| Aba Financeiro do projeto | `ProjectFinancialTab.tsx` | `financeiro` |

Cada local adiciona um botão `MessageSquare` que abre o `SendMessageModal` passando as variáveis do contexto.

### 7. `src/pages/SettingsPage.tsx`
- Remover import de `MessageTemplatesManager` antigo
- Substituir pela nova `MessageTemplatesSettings` (que usa banco)

### Arquivos novos
- `src/hooks/useMessageTemplates.ts`
- `src/components/messages/SendMessageModal.tsx`
- `src/components/settings/MessageTemplatesSettings.tsx`

### Arquivos editados
- `src/pages/SettingsPage.tsx` — trocar componente
- `src/pages/LeadsPipeline.tsx` — botão no card
- `src/pages/LeadDetail.tsx` — botão no header
- `src/pages/LeadsContracts.tsx` — botão no card
- `src/components/projects/ProjectTrackingTab.tsx` — botão
- `src/components/projects/ProjectFinancialTab.tsx` — botão

### O que NÃO muda
- Nenhuma rota existente
- Nenhuma outra funcionalidade
- `MessageTemplatesManager.tsx` antigo pode ser removido (não mais usado)

