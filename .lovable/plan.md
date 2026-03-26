

## Corrigir exibição de markdown no escopo

### Diagnóstico
O `ScopeFlowPage.tsx` já possui a função `renderText` (linhas 19-30) que converte `**texto**` para `<strong>`. O PDF e o preview já deveriam renderizar corretamente. Se o problema é visual no **textarea do formulário**, isso é esperado — textareas não renderizam HTML/markdown.

Porém, para garantir robustez e atender ao pedido:

### Edições

**1. `src/components/leads/ProposalFormNew.tsx`** (linha 187)
- Adicionar texto de ajuda abaixo do textarea: `<p className="text-xs text-muted-foreground">Use **texto** para negrito.</p>`

**2. `src/components/leads/proposal-pages/ScopeFlowPage.tsx`**
- A função `renderText` já existe e funciona. Nenhuma alteração necessária neste arquivo, a menos que haja um bug real na renderização (nesse caso, verificar se `scopeDescription` está chegando como `undefined` e caindo no `DEFAULT_SCOPE`).

### Verificação adicional
Se o problema real é que `scopeDescription` não está sendo passada corretamente ao componente (e portanto o texto do usuário não passa pelo `renderText`), precisarei verificar o fluxo de dados em `LeadsProposals.tsx` onde `buildPageProps` monta as props. Isso seria uma correção no mapeamento de dados, não na renderização.

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/leads/ProposalFormNew.tsx` | Adicionar hint "Use \*\*texto\*\* para negrito" abaixo do textarea |

Uma única edição simples. O rendering de markdown já funciona no ScopeFlowPage.

