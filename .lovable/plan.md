

## Ajuste na aprovação de cenários e status do escopo

### Alterações

**1. `src/hooks/useScenarios.ts` (linha 142)**
- Mudar `status: "planejado"` para `status: "contratado"` nos itens inseridos como `scope_type: "contratado"` dentro do `approveScenario` mutation.

**2. `src/components/projects/ProjectScenariosTab.tsx`**
- Adicionar estado `confirmApproveScenario` para armazenar o cenário pendente de confirmação.
- No botão "Aprovar", antes de chamar `approveScenario.mutate()`, verificar se já existe algum `scenario.is_approved === true` na lista. Se sim, abrir um `AlertDialog` com a mensagem: "Já existe um cenário aprovado. Aprovar este novo cenário substituirá o escopo atual. Deseja continuar?"
- Se não existir cenário aprovado, aprovar diretamente.
- Importar `AlertDialog` components do shadcn.

### Resumo das mudanças
- 2 arquivos editados
- Nenhuma aba, sub-aba ou rota alterada
- O Resumo do projeto já exibe o comparativo "Idealizado vs Contratado vs Realizado" — nenhuma alteração necessária lá

