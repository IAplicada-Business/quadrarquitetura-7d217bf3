import React from "react";
import { ProposalPageProps } from "./proposal-pages/shared";
import { ProposalCoverPage } from "./proposal-pages/CoverPage";
import { ProposalAboutPage } from "./proposal-pages/AboutPage";
import { ProposalScopeFlowPage } from "./proposal-pages/ScopeFlowPage";
import { ProposalInterioresPage } from "./proposal-pages/InterioresPage";
import { ProposalManagementFullPage } from "./proposal-pages/ManagementFullPage";
import { ProposalWhyHireValuesPage } from "./proposal-pages/WhyHireValuesPage";
import { ProposalContactPage } from "./proposal-pages/ContactPage";
import { ProposalAsset } from "@/hooks/useProposalAssets";

interface RendererProps {
  data: ProposalPageProps;
  portfolioImages: ProposalAsset[];
  feedbackImages: ProposalAsset[];
  selectedPortfolioProjects: string[];
  selectedFeedbackIds: string[];
}

export function buildProposalPages({ data }: RendererProps): React.ReactElement[] {
  return [
    <ProposalCoverPage key="cover" {...data} />,
    <ProposalAboutPage key="about" {...data} />,
    <ProposalScopeFlowPage key="scope-flow" {...data} />,
    <ProposalManagementFullPage key="management" {...data} />,
    <ProposalWhyHireValuesPage key="whyhire-values" {...data} />,
    <ProposalContactPage key="contact" {...data} />,
  ];
}
