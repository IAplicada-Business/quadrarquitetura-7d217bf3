import React from "react";
import { ProposalPageProps } from "./proposal-pages/shared";
import { ProposalCoverPage } from "./proposal-pages/CoverPage";
import { ProposalAboutPage } from "./proposal-pages/AboutPage";
import { ProposalScopePage } from "./proposal-pages/ScopePage";
import { ProposalFlowPage } from "./proposal-pages/FlowPage";
import { ProposalManagementPage } from "./proposal-pages/ManagementPage";
import { ProposalPillarPage, PILLAR_KEYS } from "./proposal-pages/PillarPage";
import { ProposalPortfolioPage } from "./proposal-pages/PortfolioPage";
import { ProposalWhyHirePage } from "./proposal-pages/WhyHirePage";
import { ProposalSeparatorPage } from "./proposal-pages/SeparatorPage";
import { ProposalFeedbackPage } from "./proposal-pages/FeedbackPage";
import { ProposalValuesPage } from "./proposal-pages/ValuesPage";
import { ProposalContactPage } from "./proposal-pages/ContactPage";
import { ProposalAsset } from "@/hooks/useProposalAssets";

interface RendererProps {
  data: ProposalPageProps;
  portfolioImages: ProposalAsset[];
  feedbackImages: ProposalAsset[];
  selectedPortfolioProjects: string[];
  selectedFeedbackIds: string[];
}

export function buildProposalPages({ data, portfolioImages, feedbackImages, selectedPortfolioProjects, selectedFeedbackIds }: RendererProps): React.ReactElement[] {
  const pages: React.ReactElement[] = [];

  // 1. Cover
  pages.push(<ProposalCoverPage key="cover" {...data} />);

  // 2. About
  pages.push(<ProposalAboutPage key="about" {...data} />);

  // 3. Scope
  pages.push(<ProposalScopePage key="scope" {...data} />);

  // 4. Flow
  pages.push(<ProposalFlowPage key="flow" {...data} />);

  // 5. Management overview
  pages.push(<ProposalManagementPage key="management" {...data} />);

  // 6-11. Pillars
  PILLAR_KEYS.forEach(key => {
    pages.push(<ProposalPillarPage key={`pillar-${key}`} pillarKey={key} {...data} />);
  });

  // Why hire
  pages.push(<ProposalWhyHirePage key="whyhire" {...data} />);

  // Portfolio section
  const portfolioGrouped = new Map<string, ProposalAsset[]>();
  portfolioImages.forEach(img => {
    if (selectedPortfolioProjects.includes(img.project_name || "")) {
      const key = img.project_name || "Projeto";
      if (!portfolioGrouped.has(key)) portfolioGrouped.set(key, []);
      portfolioGrouped.get(key)!.push(img);
    }
  });

  if (portfolioGrouped.size > 0) {
    pages.push(<ProposalSeparatorPage key="works-sep" title="Nossos Trabalhos:" />);
    portfolioGrouped.forEach((images, projName) => {
      for (let i = 0; i < images.length; i += 4) {
        pages.push(<ProposalPortfolioPage key={`portfolio-${projName}-${i}`} projectName={projName} images={images.slice(i, i + 4)} logoUrl={data.logoUrl} />);
      }
    });
  }

  // Feedback section
  const selectedFeedbacks = feedbackImages.filter(f => selectedFeedbackIds.includes(f.id));
  if (selectedFeedbacks.length > 0) {
    pages.push(<ProposalSeparatorPage key="feedback-sep" title="Feedbacks:" />);
    for (let i = 0; i < selectedFeedbacks.length; i += 4) {
      pages.push(<ProposalFeedbackPage key={`feedback-${i}`} images={selectedFeedbacks.slice(i, i + 4)} logoUrl={data.logoUrl} />);
    }
  }

  // Values
  pages.push(<ProposalValuesPage key="values" {...data} />);

  // Contact
  pages.push(<ProposalContactPage key="contact" {...data} />);

  return pages;
}
