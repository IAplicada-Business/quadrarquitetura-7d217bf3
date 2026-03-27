

## Foreign Keys — Ajuste de ON DELETE CASCADE para RESTRICT

### Estado atual

As foreign keys **já existem** no banco:
- `proposals.lead_id → leads(id)` com `ON DELETE CASCADE`
- `contracts.proposal_id → proposals(id)` com `ON DELETE CASCADE`

O problema: `CASCADE` significa que deletar um lead **apaga silenciosamente todas as propostas** vinculadas, e deletar uma proposta **apaga todos os contratos** vinculados. Isso é exatamente o risco que você quer evitar.

A tabela `projects` **não possui** coluna `lead_id`, então a terceira FK do prompt não se aplica no schema atual.

### Migration

Uma única migration para alterar o comportamento de deleção:

```sql
-- 1. proposals.lead_id: CASCADE → RESTRICT
ALTER TABLE public.proposals
  DROP CONSTRAINT proposals_lead_id_fkey,
  ADD CONSTRAINT proposals_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.leads(id)
    ON DELETE RESTRICT;

-- 2. contracts.proposal_id: CASCADE → RESTRICT
ALTER TABLE public.contracts
  DROP CONSTRAINT contracts_proposal_id_fkey,
  ADD CONSTRAINT contracts_proposal_id_fkey
    FOREIGN KEY (proposal_id) REFERENCES public.proposals(id)
    ON DELETE RESTRICT;
```

### Impacto no código

Nenhuma alteração de código é necessária. O comportamento muda apenas no banco: tentativas de deletar um lead com propostas ou uma proposta com contratos retornarão um erro do Postgres, que o Supabase SDK já propaga como `error` no retorno da query.

As telas de deleção de leads (pipeline) já tratam erros genéricos com toast — o usuário verá uma mensagem de erro se tentar deletar um lead protegido.

### Sobre `projects.lead_id`

A tabela `projects` não tem coluna `lead_id` no schema atual. Se no futuro quiser vincular projetos a leads, será necessário primeiro criar a coluna e depois a FK. Isso não faz parte desta migration.

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Alterar ON DELETE de CASCADE para RESTRICT em 2 FKs |

Nenhum arquivo de código precisa ser alterado.

