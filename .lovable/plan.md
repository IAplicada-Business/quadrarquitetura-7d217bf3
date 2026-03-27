

## Status de proposta — ajustes incrementais

A maioria do que o prompt pede **já está implementado**: a coluna `status` existe com default `'rascunho'`, a listagem tem badges, filtros e botões de ação (Enviar, Aprovar, Rejeitar). O dashboard já conta `propostasAguardando` com `status === 'enviada'`.

### O que falta implementar

**1. Toast com ação ao aprovar (LeadsProposals.tsx)**
- No botão "Aprovar" (linha 473), após o `update.mutate`, exibir toast:
  - Título: "Proposta aprovada"
  - Descrição: "Deseja converter em contrato?"
  - Ação: botão "Converter" que por enquanto apenas fecha o toast (placeholder para Prompt 6)

**2. Cores específicas nos badges (LeadsProposals.tsx)**
- Ajustar o Badge na listagem (linha 451) para usar cores explícitas:
  - Rascunho: cinza (já é `secondary`)
  - Enviada: fundo `#1B2A4A`, texto branco
  - Aprovada: verde (`bg-emerald-100 text-emerald-800`)
  - Recusada: vermelho (já é `destructive`)

**3. KPI "Propostas aprovadas no mês" (DashboardEscritorio.tsx)**
- No `computed`, adicionar:
  ```ts
  const propostasAprovadasMes = allProposals.filter(
    p => p.status === "aprovada" && p.created_at?.startsWith(format(today, "yyyy-MM"))
  ).length;
  ```
- Adicionar novo Card na seção Métricas Comerciais (após "Aguardando Resposta") com ícone `CheckCircle2`, cor verde

**4. CHECK constraint na coluna status (migration)**
- Não criar a coluna (já existe). Adicionar apenas o constraint:
  ```sql
  ALTER TABLE proposals DROP CONSTRAINT IF EXISTS proposals_status_check;
  ALTER TABLE proposals ADD CONSTRAINT proposals_status_check
    CHECK (status IN ('rascunho', 'enviada', 'aprovada', 'rejeitada'));
  ```

### Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar CHECK constraint |
| `LeadsProposals.tsx` | Toast com ação ao aprovar + cores dos badges |
| `DashboardEscritorio.tsx` | Novo KPI "Propostas aprovadas no mês" |

