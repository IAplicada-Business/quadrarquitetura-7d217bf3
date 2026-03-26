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

  const pages: React.ReactElement[] = [
    <ProposalCoverPage key="cover" {...data} />,
    <ProposalAboutPage key="about" {...data} />,
    <ProposalScopeFlowPage key="scope-flow" {...data} />,
  ];

  if (showInteriores) {
    pages.push(<ProposalInterioresPage key="interiores" {...data} />);
  }

  pages.push(
    <ProposalManagementFullPage key="management" {...data} />,
    <ProposalWhyHireValuesPage key="whyhire" {...data} />,
    <ProposalValuesPage key="values" {...data} />,
    <ProposalContactPage key="contact" {...data} />,
  );

  return pages;
}
