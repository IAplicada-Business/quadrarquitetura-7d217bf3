

## Substituir logo da proposta pela logo correta da Quadra

### Problema
A logo exibida nas páginas da proposta não é a correta. O usuário forneceu a logo branca correta da Quadra Arquitetura.

### Solução
1. Copiar a imagem enviada para `src/assets/quadra-logo-white.png`
2. Atualizar `LogoSmall` em `shared.tsx` para importar e usar essa logo como fallback (quando `url` não for fornecido)
3. Atualizar `CoverPage.tsx` para usar a mesma logo importada como fallback

### Edições

**`src/assets/quadra-logo-white.png`** — copiar o arquivo enviado

**`src/components/leads/proposal-pages/shared.tsx`**
- Importar `quadraLogoWhite` de `@/assets/quadra-logo-white.png`
- No `LogoSmall`, usar a logo importada como fallback: `src={url || quadraLogoWhite}` e remover o `if (!url) return null`

**`src/components/leads/proposal-pages/CoverPage.tsx`**
- Importar `quadraLogoWhite` de `@/assets/quadra-logo-white.png`
- Usar como fallback no lugar do texto "QUADRA" quando `logoUrl` não está definido

