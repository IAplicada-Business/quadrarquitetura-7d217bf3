

## Ajustar enquadramento da foto — AboutPage

### Problema
A foto das sócias está mostrando muito teto/parede acima delas. Precisa descer o ponto focal para mostrar menos espaço vazio acima e mais das sócias.

### Solução
Em `AboutPage.tsx`, alterar `objectPosition` de `"20% 0%"` para `"20% 15%"` — o segundo valor (vertical) sai de 0% (topo) para 15%, cortando um pouco do espaço vazio acima e centralizando melhor as duas.

### Edição: `src/components/leads/proposal-pages/AboutPage.tsx` linha 26
- De: `objectPosition: "20% 0%"`
- Para: `objectPosition: "20% 15%"`

