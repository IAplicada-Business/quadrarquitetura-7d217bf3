import { PageContainer, COLORS, type ProposalPageProps } from "./shared";
import { ProposalAsset } from "@/hooks/useProposalAssets";

interface FeedbackPageProps extends ProposalPageProps {
  images: ProposalAsset[];
}

export function ProposalFeedbackPage({ images, logoUrl }: FeedbackPageProps) {
  const displayImages = images.slice(0, 4);
  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: "30px 40px", height: "100%", display: "grid", gridTemplateColumns: displayImages.length <= 2 ? "1fr 1fr" : "1fr 1fr", gridTemplateRows: displayImages.length <= 2 ? "1fr" : "1fr 1fr", gap: 12 }}>
        {displayImages.map((img, i) => (
          <div key={i} style={{ borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={img.file_url || ""} alt={img.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
