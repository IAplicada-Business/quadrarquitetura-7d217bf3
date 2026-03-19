import { PageContainer, COLORS, LogoSmall, type ProposalPageProps } from "./shared";
import { ProposalAsset } from "@/hooks/useProposalAssets";

interface PortfolioPageProps extends ProposalPageProps {
  projectName: string;
  images: ProposalAsset[];
}

export function ProposalPortfolioPage({ projectName, images, logoUrl }: PortfolioPageProps) {
  const displayImages = images.slice(0, 4);
  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: "40px 60px", height: "100%", display: "flex", flexDirection: "column" }}>
        <h2 style={{ color: COLORS.textoTituloVinho, fontSize: 28, fontWeight: 700, textTransform: "uppercase", marginBottom: 24 }}>
          {projectName}
        </h2>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: displayImages.length <= 2 ? "1fr 1fr" : "1fr 1fr", gridTemplateRows: displayImages.length <= 2 ? "1fr" : "1fr 1fr", gap: 16 }}>
          {displayImages.map((img, i) => (
            <div key={i} style={{ borderRadius: 8, overflow: "hidden" }}>
              <img src={img.file_url || ""} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      </div>
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
