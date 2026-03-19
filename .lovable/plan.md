

## Correção Completa da Proposta — Alinhamento com PDF de Referencia

### Problemas Identificados

Comparando o PDF de referencia (33 paginas) com a implementacao atual:

**1. Formato de saida**: O sistema ja gera PDF via `html2canvas` + `jsPDF` (client-side). Nao gera PPTX. O formato esta correto.

**2. Pagina 1 (Cover)**: Atualmente usa foto das socias como background — o PDF original nao tem foto na capa. A capa original e fundo azul-marinho solido com shape decorativo no canto inferior esquerdo. A foto das socias foi adicionada a pedido do usuario anteriormente, entao manter.

**3. Pagina 3 (Scope)**: No PDF original, o escopo inclui **texto com palavras em destaque** (bold em cor vinho para "projeto executivo" e "o gerenciamento"). A implementacao atual suporta `**bold**` markdown mas renderiza em preto — precisa renderizar bold em cor vinho `#8B4557`.

**4. Pagina 4 (Flow — "Como funciona nosso servico?")**: **Desalinhamento critico**. O PDF original usa layout em 2 linhas com **setas grandes** (arrow shapes) conectando os steps, nao boxes alinhados horizontalmente. Layout original:
  - Linha 1: `Levantamento → (4 DIAS) → Estudo Preliminar → (15 DIAS) → Orcamento Executivo →`
  - Linha 2: `Reuniao Prioridades → (7 DIAS) → Inicio da Obra`
  - Steps com **setas (arrow shapes)** tipo chevron, nao retangulos com linhas finas
  - Cores das setas: rose-mauve para as primeiras, azul-marinho para as ultimas
  - O componente atual usa boxes retangulares em linha unica com linhas finas — nao corresponde ao original

**5. Pagina 5 (Management)**: O original usa background **bege claro** (nao azul-marinho) com icones **detalhados e grandes** (ilustracoes complexas, nao Lucide simples). O componente atual usa fundo azul com Lucide icons em circulos — incorreto. Corrigir para fundo bege com icones rose-mauve maiores.

**6. Paginas 6-11 (Pillars)**: O original usa fundo rose-mauve com:
  - Icone grande no canto superior esquerdo (ilustracao detalhada)
  - Titulo a esquerda, bullets a direita  
  - Logo "QUADRA ARQUITETURA" no canto inferior (nao LogoSmall com imagem)
  - Shape decorativo no canto inferior direito
  - A implementacao atual esta **razoavelmente alinhada** mas usa Lucide icons simples vs ilustracoes detalhadas do original. Aceitar Lucide como aproximacao.

**7. Ordem das paginas**: O `ProposalPageRenderer` coloca Portfolio ANTES de WhyHire, mas o original coloca Portfolio (paginas 12-20) ANTES de WhyHire (21), depois "Nossos Trabalhos" separator (22), mais fotos (23-26), Feedbacks separator (27), feedbacks (28-31), Valores (32), Contato (33). A ordem atual esta correta.

**8. Pagina "WhyHire"**: O original tem fundo **azul-marinho** com icones/ilustracoes grandes acima de cada diferencial em 4 colunas. O componente atual usa cards com bordas — precisa usar icones + texto sem borda, similar ao original.

**9. Pagina "Valores" (32)**: O original tem layout **centralizado** com valores empilhados verticalmente, nao alinhados a esquerda. O preco riscado (R$16.500) com linha vermelha, depois R$15.000 abaixo, formas de pagamento centralizadas. O componente atual alinha a esquerda — precisa centralizar.

**10. Pagina "Contato" (33)**: O original usa fundo **rose-mauve** (nao azul). O componente atual ja usa roseMauve — correto.

**11. Separators**: O original tem icones nas paginas separadoras (estrelas, thumbs up/down para "Nossos Trabalhos"). Implementacao atual so tem texto.

---

### Plano de Correcao

**Arquivos a editar**:

1. **`ScopePage.tsx`** — Renderizar `**texto**` bold em cor vinho `#8B4557` em vez de preto

2. **`FlowPage.tsx`** — Redesign completo:
   - Layout em 2 linhas (3 steps em cima, 2 embaixo)
   - Setas tipo chevron/arrow shapes (CSS) em vez de retangulos
   - Rose-mauve para setas menores, azul-marinho para setas grandes
   - "X DIAS" acima de cada seta de conexao
   - Sub-texto abaixo de cada step

3. **`ManagementPage.tsx`** — Mudar fundo para `begeClaro`, cor dos icones para `textoTituloVinho`, aumentar tamanho dos icones, remover circulos de borda

4. **`WhyHirePage.tsx`** — Remover cards com borda, usar layout 4 colunas com icones Lucide grandes acima de cada texto (Wrench, FileText, Lightbulb, CheckCircle)

5. **`ValuesPage.tsx`** — Centralizar todo o conteudo, preco cheio com linha riscada vermelha, preco com desconto abaixo

6. **`SeparatorPage.tsx`** — Adicionar shape decorativo no canto inferior direito e logo no canto superior esquerdo

Nenhuma mudanca de banco, storage ou rotas. Apenas correcao visual dos componentes de pagina.

