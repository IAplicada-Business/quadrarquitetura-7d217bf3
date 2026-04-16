import type { ContractPageProps } from "./contract-pages/shared";
import { ContractCoverPage } from "./contract-pages/ContractCoverPage";
import { QuadroResumoPage } from "./contract-pages/QuadroResumoPage";
import { ClausePage } from "./contract-pages/ClausePage";
import { AnexoCronogramaPage } from "./contract-pages/AnexoCronogramaPage";
import { SignaturePage } from "./contract-pages/SignaturePage";
import { ALL_CLAUSES } from "@/data/defaultContractClauses";

// Approximate max characters per clause page at 9px font in the usable area
const MAX_CHARS_PER_PAGE = 2800;

interface ClauseItem {
  number: number;
  title: string;
  content: string;
}

function groupClausesIntoPages(clauses: ClauseItem[]): ClauseItem[][] {
  const pages: ClauseItem[][] = [];
  let currentPage: ClauseItem[] = [];
  let currentChars = 0;

  for (const clause of clauses) {
    const clauseChars = clause.title.length + clause.content.length;

    if (currentChars + clauseChars > MAX_CHARS_PER_PAGE && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      currentChars = 0;
    }

    // If a single clause exceeds the limit, it gets its own page
    currentPage.push(clause);
    currentChars += clauseChars;

    if (currentChars >= MAX_CHARS_PER_PAGE) {
      pages.push(currentPage);
      currentPage = [];
      currentChars = 0;
    }
  }

  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

export function buildContractPages(data: ContractPageProps): React.ReactElement[] {
  const pages: React.ReactElement[] = [];

  // 1. Cover page
  pages.push(
    <ContractCoverPage
      key="cover"
      contractNumber={data.contractNumber}
      clientName={data.clientName}
      projectName={data.projectName}
    />
  );

  // 2. Quadro Resumo
  pages.push(<QuadroResumoPage key="resumo" {...data} />);

  // 3. Clause pages
  const clauseGroups = groupClausesIntoPages(ALL_CLAUSES);
  clauseGroups.forEach((group, idx) => {
    const pageNum = idx + 3; // Cover=1, Resumo=2, clauses start at 3
    pages.push(
      <ClausePage
        key={`clause-${idx}`}
        clauses={group}
        pageNumber={pageNum}
        isEvenPage={pageNum % 2 === 0}
      />
    );
  });

  // 4. Anexo Cronograma
  pages.push(<AnexoCronogramaPage key="anexo" {...data} />);

  // 5. Signature page
  pages.push(<SignaturePage key="signature" {...data} />);

  return pages;
}
