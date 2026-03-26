import React from "react";
import { ProposalPageProps } from "./proposal-pages/shared";
import { ProposalCoverPage } from "./proposal-pages/CoverPage";
import { ProposalAboutPage } from "./proposal-pages/AboutPage";
import { ProposalScopeFlowPage } from "./proposal-pages/ScopeFlowPage";
import { ProposalInterioresPage } from "./proposal-pages/InterioresPage";
import { ProposalManagementFullPage } from "./proposal-pages/ManagementFullPage";
import { ProposalWhyHireValuesPage } from "./proposal-pages/WhyHireValuesPage";
import { ProposalValuesPage } from "./proposal-pages/ValuesPage";
import { ProposalContactPage } from "./proposal-pages/ContactPage";
import { ProposalPortfolioCardsPage } from "./proposal-pages/PortfolioCardsPage";
import { ProposalAsset } from "@/hooks/useProposalAssets";

interface RendererProps {
  data: ProposalPageProps;
  portfolioImages: ProposalAsset[];
  feedbackImages: ProposalAsset[];
  selectedPortfolioProjects: string[];
  selectedFeedbackIds: string[];
  formato?: "a4" | "apresentacao";
}

export function buildProposalPages({ data, formato }: RendererProps): React.ReactElement[] {
  const showInteriores = !data.servicesIncluded || data.servicesIncluded === "ambos" || data.servicesIncluded === "projeto";

  // Add page dimensions for presentation format
  const pageData = formato === "apresentacao"
    ? { ...data, pageWidth: 1280, pageHeight: 720 }
    : data;

  const pages: React.ReactElement[] = [
    <ProposalCoverPage key="cover" {...pageData} />,
    <ProposalAboutPage key="about" {...pageData} />,
    <ProposalScopeFlowPage key="scope-flow" {...pageData} />,
  ];

  if (showInteriores) {
    pages.push(<ProposalInterioresPage key="interiores" {...pageData} />);
  }

  pages.push(
    <ProposalManagementFullPage key="management" {...pageData} />,
    <ProposalWhyHireValuesPage key="whyhire" {...pageData} />,
  );

  if (pageData.portfolioCards && pageData.portfolioCards.length > 0) {
    pages.push(<ProposalPortfolioCardsPage key="portfolio-cards" {...pageData} />);
  }

  pages.push(
    <ProposalValuesPage key="values" {...pageData} />,
    <ProposalContactPage key="contact" {...pageData} />,
  );

  return pages;
}
