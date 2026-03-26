import { ProposalAsset } from "@/hooks/useProposalAssets";

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

// 595×842 matches the HTML template dimensions
export const PAGE_W = 595;
export const PAGE_H = 842;

export const FONT_TITLE = "'Cormorant Garamond', serif";
export const FONT_BODY = "'Jost', sans-serif";

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
  ambientes?: string[];
  totalArea?: number | null;
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
        fontFamily: FONT_BODY,
      }}
    >
      {children}
    </div>
  );
}

export function LogoQuadra() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        right: 28,
        fontFamily: FONT_BODY,
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: 3,
        color: COLORS.textoClaro,
        opacity: 0.7,
        lineHeight: 1,
        textAlign: "right",
      }}
    >
      QUA
      <small style={{ fontSize: 8, letterSpacing: 4, display: "block", marginTop: 2, fontWeight: 300 }}>DRA</small>
    </div>
  );
}

export function LogoSmall({ url, position = "br" }: { url?: string; position?: "br" | "bl" }) {
  return <LogoQuadra />;
}

export function DecorativeShape({ position = "bl", color = COLORS.shapeBege }: { position?: "bl" | "br"; color?: string }) {
  return null; // Not used in new design
}

export function formatBRL(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
