# Quadra Arquitetura

Sistema operacional da Quadra Arquitetura — gestão comercial, obras, financeiro, tarefas e conteúdo.

**Lovable:** https://lovable.dev/projects/bb62f3cc-01c8-4342-80c8-67a725b43124  
**App:** https://quadrarquitetura.lovable.app  
**Repo canônico:** https://github.com/IAplicada-Business/quadrarquitetura-7d217bf3  
**Repo legado:** https://github.com/IAplicada-Business/quadrarquitetura

## Status da sincronização (28/07/2026)

O repositório novo foi criado na transição GitHub do Lovable. Comparado com o legado:

| Item | Status |
|---|---|
| Commit `main` | Idêntico (`bf621bd`) |
| Histórico | 1188 commits em ambos |
| Árvore de arquivos | 426 arquivos, checksums iguais |
| Supabase | Mesmo projeto `thnmhsuniahctdnobpem` |
| Edge functions | 15 (incl. `create-user` / `delete-user`) |
| Migrations | 99 |
| Knowledge Lovable | Restaurado a partir do inventário do repo legado |

Branch legada `lovable-sync-1782789294` (delete-user) já está absorvida no `main` via commits posteriores — não há funcionalidade pendente nela.

## Stack

- Vite + React + TypeScript
- shadcn/ui + Tailwind CSS
- Supabase (Auth, Postgres, Storage, Edge Functions)
- PWA (`vite-plugin-pwa`)

## Como editar

**Lovable** — abra o projeto e faça prompts; commits vão para este repo.

**IDE local:**

```sh
git clone https://github.com/IAplicada-Business/quadrarquitetura-7d217bf3.git
cd quadrarquitetura-7d217bf3
npm i
npm run dev
```

Scripts úteis: `npm run build`, `npm test`, `npm run lint`.

## Módulos principais

- **Análises:** Dashboard Comercial, Obras, Financeiro (lançamentos, NFs, gráficos)
- **Comercial:** Leads, Clientes, Propostas, Contratos
- **Obras:** Escopo / Orçamentos / Materiais / Cronograma (disciplina-first), Checklist, Prestação de Contas, Portal do cliente
- **Tarefas:** Kanban Projetos, Kanban Quadra, Audio Tasks
- **Conteúdo:** Calendário, Roteiros, Publicações, Instagram
- **Admin:** Configurações + Usuários com permissão por tela

## Deploy / domínio

Publicação e domínio customizado: Project → Share/Publish e Settings → Domains no Lovable.  
Docs: https://docs.lovable.dev/features/custom-domain
