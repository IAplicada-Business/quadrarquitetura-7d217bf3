

## Capa com nome do projeto dinâmico

### Edições

**1. `src/components/leads/proposal-pages/CoverPage.tsx`**
- Substituir o conteúdo do bloco inferior (linhas 58-82) por:
  - Linha principal (maior): `clientName || "CLIENTE"` — mantém estilo atual (Jost, 16px, letterSpacing 6, uppercase, opacity 0.85)
  - Linha secundária: `projectName` — fontSize 11, letterSpacing 4, opacity 0.55, uppercase
  - Se `projectName` for vazio/null/undefined, não renderizar a linha secundária
- Remover o texto fixo "Projeto" que está hardcoded na linha 81

**2. `src/components/leads/ProposalFormNew.tsx`**
- Atualizar o placeholder do campo "Nome do projeto" (linha 206) para `"Ex: Reforma Sala e Cozinha — Apto Vila da Serra"`
- O campo já está mapeado para `project_name` e já é passado via `buildPageProps` — nenhuma outra alteração necessária

### Arquivos

| Arquivo | Ação |
|---|---|
| `CoverPage.tsx` | Substituir subtítulo fixo por `projectName` dinâmico |
| `ProposalFormNew.tsx` | Atualizar placeholder |

