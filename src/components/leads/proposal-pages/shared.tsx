import { ProposalAsset } from "@/hooks/useProposalAssets";
import quadraLogoWhite from "@/assets/quadra-logo-white.png";

// Shared types and constants for proposal pages
export const COLORS = {
  azulMarinho: "#1B2A4A",
  begeClaro: "#F5E0D0",
  roseMauve: "#9B6B7B",
  textoClaro: "#F0DCC8",
  textoTituloVinho: "#8B4557",
  textoEscuro: "#1B2A4A",
  linhaDestaque: "#C4756E",
  shapeBege: "#D4B8A0",
} as const;

// A4 portrait ratio (210x297mm) — pixel dimensions for rendering
export const PAGE_W = 794;
export const PAGE_H = 1123;

export interface ProposalPageProps {
  clientName?: string;
  projectName?: string;
  scopeDescription?: string;
  servicesIncluded?: string;
  timelineBriefing?: number;
  timelineStudy?: number;
  timelinePriorities?: number;
  timelineConstruction?: number;
  priceFull?: number | null;
  priceCash?: number | null;
  installmentsCount?: number | null;
  installmentEntry?: number | null;
  installmentValue?: number | null;
  priceNote?: string;
  logoUrl?: string;
  founderPhotos?: ProposalAsset[];
  aboutText?: string;
  pillarTexts?: Record<string, string>;
  differentials?: string[];
  portfolioImages?: ProposalAsset[];
  feedbackImages?: ProposalAsset[];
  contactInstagram?: string;
  contactPhone1?: string;
  contactPhone2?: string;
}

export function PageContainer({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: PAGE_W,
        height: PAGE_H,
        background: bg,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {children}
    </div>
  );
}

export function LogoSmall({ url, position = "br" }: { url?: string; position?: "br" | "bl" }) {
  if (!url) return null;
  const style: React.CSSProperties = {
    position: "absolute",
    bottom: 24,
    height: 36,
    opacity: 0.9,
    ...(position === "br" ? { right: 36 } : { left: 36 }),
  };
  return <img src={url} alt="Quadra" style={style} />;
}

export function DecorativeShape({ position = "bl", color = COLORS.shapeBege }: { position?: "bl" | "br"; color?: string }) {
  const isLeft = position === "bl";
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        [isLeft ? "left" : "right"]: 0,
        width: 120,
        height: 120,
        background: "transparent",
        borderLeft: isLeft ? `3px solid ${color}` : "none",
        borderRight: !isLeft ? `3px solid ${color}` : "none",
        borderBottom: `3px solid ${color}`,
        clipPath: isLeft
          ? "polygon(0 30%, 0 100%, 70% 100%)"
          : "polygon(30% 100%, 100% 100%, 100% 30%)",
      }}
    />
  );
}

export function formatBRL(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
