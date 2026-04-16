

## Plano: Mover "Próximos 7 posts" para baixo do calendário

### Alteração

**`src/pages/ContentCalendar.tsx`**

- Remover o layout flex side-by-side (`flex gap-6`) que coloca calendário e sidebar lado a lado
- Calendário ocupa 100% da largura (sem `flex-1`, sem sidebar lateral)
- Mover a seção "Próximos 7 posts" para baixo do calendário + barra de progresso
- No mobile e desktop, mesma estrutura: calendário full-width, depois lista de próximos posts em grid horizontal (ex: `grid grid-cols-2 lg:grid-cols-4 gap-4`)
- Remover condicional `!isMobile` que ocultava a sidebar no mobile

### O que NÃO muda
- Lógica, dados, rotas, demais componentes

