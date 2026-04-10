

## Plano: Reorganizar sidebar — novo grupo "Análises Quadra"

### Alteração única: `src/components/layout/AppSidebar.tsx`

Reorganizar o array `menuGroups` para:

1. **Criar novo grupo "Análises Quadra"** como primeiro item do array (acima de Comercial)
2. Mover para ele:
   - Dashboard Escritório (`/dashboard/escritorio`)
   - Dashboard Obras (`/dashboard/obras`)
   - Relatórios (`/construction/reports`)
3. **Remover** esses 3 itens dos seus grupos atuais (Administrativo)
4. Atualizar `routeGroupMap` para mapear `/dashboard` e `/construction/reports` ao novo grupo

### Estrutura resultante do sidebar:
```text
▾ Análises Quadra
    Dashboard Escritório
    Dashboard Obras
    Relatórios
▾ Comercial
    Leads
    Documentos ▸
    Clientes
▾ Gestão de Obras
    Obras
    Acompanhamento
    Tarefas ▸
    Fornecedores
▾ Gestão de Conteúdo
    Calendário
    Roteiros
    Publicações
▾ Administrativo
    Configurações
    Usuários
    Notas Fiscais
```

### O que NÃO muda
- Nenhuma rota
- Nenhuma página ou componente
- Funcionalidade existente intacta

