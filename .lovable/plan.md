

## Aprovar Cotação + Gerar Pagamentos Automáticos

### Migration SQL

```sql
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS cotacao_aprovada boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cotacao_valor_total numeric,
  ADD COLUMN IF NOT EXISTS cotacao_aprovada_at timestamptz;
```

### `src/components/projects/ProjectScenariosTab.tsx`

1. **Banner pós-aprovação**: Quando `project.cotacao_aprovada === true`, exibir banner verde no topo com data, total e botão "Ver pagamentos" (seta para aba financeiro via `onTabChange` prop). Desabilitar edição de valores nos cenários (inputs readonly).

2. **Botão "Aprovar Cotação"**: Ao lado de "Analisar Orçamento", visível quando há cenário aprovado e `cotacao_aprovada === false`. Abre modal de confirmação.

3. **Modal de Aprovação**: Exibe totais do cenário aprovado (materiais, MO, total). Campos editáveis:
   - Número de parcelas (number)
   - Data da primeira parcela (date picker)
   - Intervalo (select: semanal/quinzenal/mensal)
   
   Ao confirmar:
   - `UPDATE projects SET cotacao_aprovada=true, cotacao_valor_total=X, cotacao_aprovada_at=now()`
   - Loop de INSERT em `payments` com parcelas calculadas (valor/N, datas espaçadas conforme intervalo)
   - Cada payment: `{ description: "Parcela N/Total — Obra", source: "cotacao", status: "pendente" }`
   - Toast com link para aba financeiro

4. **Botão "Revisar Cotação"**: Quando `cotacao_aprovada === true`, substitui o botão aprovar. Abre AlertDialog: "Revisar a cotação irá excluir os pagamentos gerados. Confirmar?" → deleta payments com `source='cotacao'`, reseta `cotacao_aprovada=false`.

5. **Prop `onTabChange`**: Adicionar ao componente (já existe no ProjectDetail) para navegar à aba financeiro.

### `src/components/projects/ProjectFinancialTab.tsx`

Na tabela de pagamentos, adicionar badge "Gerado da cotação" quando `payment.source === 'cotacao'`, ao lado do status badge existente.

### `src/pages/ProjectDetail.tsx`

Passar `onTabChange={setActiveTab}` como prop para `ProjectScenariosTab`.

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| Migration SQL | 3 colunas em projects |
| `src/components/projects/ProjectScenariosTab.tsx` | Modal aprovação, banner, botão revisar, geração de payments |
| `src/components/projects/ProjectFinancialTab.tsx` | Badge "Gerado da cotação" |
| `src/pages/ProjectDetail.tsx` | Passar onTabChange ao ProjectScenariosTab |

