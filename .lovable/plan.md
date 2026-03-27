

## Nova página de detalhe do lead `/leads/:id` com seção "Propostas"

### Resumo
Criar uma página dedicada para exibir detalhes de um lead e listar suas propostas vinculadas. Acessível via clique no nome do lead na pipeline/tabela.

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/LeadDetail.tsx` | Nova página |
| `src/App.tsx` | Adicionar rota `/leads/:id` |
| `src/pages/LeadsPipeline.tsx` | Tornar nome do lead clicável (link para `/leads/:id`) |

### Detalhes técnicos

**1. `src/pages/LeadDetail.tsx`**
- Usa `useParams` para obter `id` do lead
- Busca lead via `useLeads()` e filtra pelo id (já carrega todos do usuário)
- Query dedicada para propostas do lead:
  ```ts
  useQuery({
    queryKey: ["proposals", "by-lead", leadId],
    queryFn: () => supabase.from("proposals")
      .select("*").eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => { if (error) throw error; return data; }),
    enabled: !!leadId,
  })
  ```
- **Cabeçalho**: nome do lead, telefone, email, badges de tipo/origem/status, botão "Voltar"
- **Seção "Propostas"**: tabela com colunas:
  - Nome do projeto (`project_name`)
  - Data de criação (formatada `dd/mm/aaaa`)
  - Valor (`price_full` formatado em R$)
  - Status (badge com cores: rascunho=cinza, enviada=`#1B2A4A`, aprovada=emerald, rejeitada=red)
  - Ações: Visualizar, Duplicar, Gerar PDF
- **Estado vazio**: "Nenhuma proposta gerada para este lead ainda." + botão "Criar proposta" que navega para `/leads/proposals`
- **Ação Visualizar**: navega para `/leads/proposals` com state `{ editProposalId: proposal.id }`
- **Ação Duplicar**: insere nova proposta copiando campos principais, status = "rascunho", toast de sucesso
- **Ação Gerar PDF**: reutiliza `generateProposalPdf` + `buildProposalPages` (mesma lógica de LeadsProposals)

**2. `src/App.tsx`**
- Importar `LeadDetail`
- Adicionar `<Route path="/leads/:id" element={<LeadDetail />} />` no bloco de rotas de Leads

**3. `src/pages/LeadsPipeline.tsx`**
- No card kanban e na linha da tabela, tornar o nome do lead um link/botão que navega para `/leads/${lead.id}`

