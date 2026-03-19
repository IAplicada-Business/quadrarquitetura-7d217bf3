

## Ajuste no filtro da Visão Cliente do Cronograma

### Estado atual
A aba "Visão Cliente" já existe dentro do Cronograma (`ProjectScheduleTab.tsx`, linha 151) com:
- Agrupamento semanal por disciplina com cores
- Botão "Exportar PDF" e "Copiar para Enviar"
- Merge de semanas consecutivas com mesmas disciplinas
- Layout limpo e profissional

### Problema encontrado
O filtro atual (linha 97) usa `t.is_client_visible !== false`, o que inclui atividades onde `is_client_visible` é `null` ou `undefined`. A solicitação pede que **apenas** atividades com `is_client_visible = true` apareçam.

### Alteração necessária

**Arquivo: `src/components/projects/ProjectScheduleTab.tsx`** — Linha 97

Trocar:
```typescript
items.filter((t: any) => t.is_client_visible !== false)
```
Por:
```typescript
items.filter((t: any) => t.is_client_visible === true)
```

Nenhuma outra alteração é necessária. Nenhuma aba, sub-aba ou rota será modificada.

