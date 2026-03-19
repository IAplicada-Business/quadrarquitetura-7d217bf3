import { PageContainer, COLORS, DecorativeShape, type ProposalPageProps } from "./shared";
import sociasCover from "@/assets/socias-cover.jpg";
import quadraLogoWhite from "@/assets/quadra-logo-white.png";

export function ProposalCoverPage({ clientName, projectName, logoUrl }: ProposalPageProps) {
  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <img src={sociasCover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%" }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(27, 42, 74, 0.72)" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", zIndex: 1 }}>
        <h1 style={{ color: COLORS.textoClaro, fontSize: 48, fontWeight: 700, letterSpacing: 10, textTransform: "uppercase", margin: 0 }}>PROPOSTA</h1>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 32, fontWeight: 600, textTransform: "uppercase", marginTop: 20, letterSpacing: 4 }}>{clientName || "CLIENTE"}</h2>
        <h3 style={{ color: COLORS.textoClaro, fontSize: 24, fontWeight: 400, textTransform: "uppercase", marginTop: 10, letterSpacing: 3, opacity: 0.85 }}>{projectName || "PROJETO"}</h3>
      </div>
      {logoUrl ? (
        <img src={logoUrl} alt="Quadra" style={{ position: "absolute", bottom: 36, right: 40, height: 44, zIndex: 2 }} />
      ) : (
        <span style={{ position: "absolute", bottom: 36, right: 40, color: COLORS.textoClaro, fontSize: 22, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", opacity: 0.7, zIndex: 2 }}>QUADRA</span>
      )}
      <DecorativeShape position="bl" />
    </PageContainer>
  );
}
