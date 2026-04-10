

## Plano: Corrigir conversão lead → cliente + badge de projeto

### 1. Migration SQL
Adicionar colunas `source_lead_id` e `converted_at` na tabela `clients`:
```sql
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS source_lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at timestamptz;
```

### 2. `src/hooks/useLeads.ts` (linhas 128-143)
Expandir o insert do cliente para incluir todos os campos disponíveis:
```ts
.insert({
  user_id: user!.id,
  name: lead.name,
  email: lead.email,
  phone: lead.phone,
  phone_secondary: lead.phone_secondary ?? null,
  client_type: lead.project_type as any,
  origin: lead.origin as any,
  observations: lead.notes ?? null,
  source_lead_id: lead.id,
  converted_at: new Date().toISOString(),
})
```

### 3. `src/pages/Clients.tsx`
- Atualizar a interface `Client` com `source_lead_id`, `converted_at`, `project_id`, `project_number`, `project_name`
- Alterar `fetchClients` para usar query RPC ou raw select que faz LEFT JOIN com projects:
  ```ts
  const { data } = await supabase
    .from("clients")
    .select("*, projects!projects_client_id_fkey(id, project_number, name)")
    .order("created_at", { ascending: false });
  ```
  Nota: se não houver FK nomeada, usar query manual via `supabase.rpc` ou fazer duas queries (clients + projects por client_id)
- Na coluna "Nome" da tabela, após o nome do cliente, renderizar badge clicável se houver projeto vinculado:
  ```tsx
  <TableCell className="font-medium">
    {client.name}
    {client.project_number && (
      <Badge className="ml-2 cursor-pointer" onClick={() => navigate(`/projects/${client.project_id}`)}>
        {client.project_number}
      </Badge>
    )}
  </TableCell>
  ```
- Importar `Badge` de `@/components/ui/badge` e `useNavigate` de `react-router-dom`

### O que NÃO muda
- Nenhuma outra lógica de clientes (CRUD, filtros, formulário)
- Nenhuma outra lógica de leads

