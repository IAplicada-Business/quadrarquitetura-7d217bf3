

## Plano: Destacar botão do microfone no header

O botão do microfone atualmente usa `bg-accent/10` que é quase invisível sobre o fundo escuro do header.

### Alteração

Arquivo: `src/components/layout/AppHeader.tsx` (linha 93)

Trocar a classe do botão de:
```
p-2 rounded-full bg-accent/10 text-accent hover:bg-accent/20
```
Para:
```
p-2.5 rounded-full bg-secondary text-accent shadow-sm hover:bg-secondary/80
```

Isso usa `bg-secondary` (rosa claro da marca, `350 30% 88%`) como fundo do card redondo, mantendo o ícone na cor accent (rosa). O `shadow-sm` dá leve profundidade e o `p-2.5` aumenta levemente o padding para parecer um card.

