

## Atualizar página "Quem Somos" da proposta

### O que muda

1. **Substituir as fotos individuais circulares** pela foto conjunta das sócias (imagem enviada `cena4_risada_cartier-2.png`)
2. **Usar o texto e informações do PDF de referência**:
   - Texto "sobre": *"A Quadra é uma empresa que nasceu em 2022 pela inquietação da seguinte pergunta: como fazer com que nossos clientes tenham no final da sua obra seu projeto exatamente igual ao do 3d? Assim, desenvolvemos também o serviço de gerenciamento de obra no qual oferecemos aos nossos clientes assessoria completa pra ter seu espaço do jeitinho que ele sempre sonhou."*
   - Camilla — Formada em Arquitetura pela FUMEC, 2018
   - Mariana — Formada em Arquitetura pela UFMG, 2021. Pós Graduação em Arquitetura Hospitalar
3. **Layout A4 portrait**: Título "QUEM SOMOS" no topo, texto descritivo abaixo, depois a foto grande das duas juntas (estilo retangular com bordas arredondadas, não circular), com os nomes e formações abaixo da foto lado a lado.

### Arquivos

**1. Copiar a foto** para `src/assets/founders-photo.png`

**2. `AboutPage.tsx`** — Refatorar layout:
- Remover fotos circulares individuais do `founderPhotos`
- Importar a foto fixa das sócias
- Layout vertical: título → texto → foto retangular (largura ~500px, altura ~350px, object-fit cover, border-radius 12px) → nomes/formações lado a lado abaixo da foto
- Usar o `aboutText` como fallback mas definir o texto padrão do PDF como default
- Manter watermark "QUADRA ARQUITETURA" e logo pequena

