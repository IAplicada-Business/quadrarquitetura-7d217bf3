

## Plano: Remover formato apresentação das propostas

Remover o botão "Gerar Apresentação (16:9)" e todo o código relacionado ao formato `apresentacao`, mantendo apenas o PDF A4.

### Alterações

**1. `src/components/leads/ProposalFormNew.tsx`**
- Remover prop `onGeneratePdfApresentacao` da interface e do componente
- Remover o botão "Gerar Apresentação (16:9)" do JSX
- Remover import `Monitor` do Lucide

**2. `src/pages/LeadsProposals.tsx`**
- Remover função `handleGeneratePdf16x9` inteira
- Remover prop `onGeneratePdfApresentacao` passada ao `ProposalFormNew`
- Remover parâmetro `formato` do `buildPages` (sempre A4)

**3. `src/lib/generateProposalPdf.ts`**
- Remover parâmetro `formato` da função `generateProposalPdf` (sempre A4)
- Remover constantes `PDF_W_16_9_PT`, `PDF_H_16_9_PT`
- Remover lógica condicional `isPresentation`

**4. `src/components/leads/ProposalPageRenderer.tsx`**
- Remover prop `formato` da interface
- Remover lógica condicional de dimensões 16:9

**5. `src/components/leads/proposal-pages/shared.tsx`**
- Remover constantes `PAGE_W_16_9` e `PAGE_H_16_9`

### O que NÃO muda
- Formato A4, rotas, lógica de dados, demais componentes

