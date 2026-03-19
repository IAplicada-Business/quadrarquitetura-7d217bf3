

## Ajuste da Capa — Foto das Sócias como Background

### O que fazer
1. Copiar a imagem `user-uploads://output_scene6.jpg` para `src/assets/socias-cover.jpg`
2. Editar `CoverPage.tsx` para incluir a foto como imagem de fundo atrás do texto, com overlay escuro semitransparente (azul-marinho ~70-75% opacity) para manter legibilidade do texto

### Implementação em `CoverPage.tsx`
- Adicionar `import sociasCover from "@/assets/socias-cover.jpg"`
- Estrutura: imagem full-cover com `objectFit: cover` + overlay div com `background: rgba(27,42,74, 0.72)` cobrindo tudo + texto por cima
- O background sólido `COLORS.azulMarinho` do `PageContainer` serve como fallback
- Logo e shape decorativo permanecem inalterados

### Arquivos
- Copiar: `user-uploads://output_scene6.jpg` → `src/assets/socias-cover.jpg`
- Editar: `src/components/leads/proposal-pages/CoverPage.tsx`

