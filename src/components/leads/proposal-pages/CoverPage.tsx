import { PageContainer, COLORS, DecorativeShape, type ProposalPageProps } from "./shared";

export function ProposalCoverPage({ clientName, projectName, logoUrl }: ProposalPageProps) {
  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
        <h1 style={{ color: COLORS.textoClaro, fontSize: 72, fontWeight: 700, letterSpacing: 12, textTransform: "uppercase", margin: 0 }}>PROPOSTA</h1>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 48, fontWeight: 600, textTransform: "uppercase", marginTop: 24, letterSpacing: 4 }}>{clientName || "CLIENTE"}</h2>
        <h3 style={{ color: COLORS.textoClaro, fontSize: 36, fontWeight: 400, textTransform: "uppercase", marginTop: 12, letterSpacing: 3, opacity: 0.85 }}>{projectName || "PROJETO"}</h3>
      </div>
      {logoUrl && <img src={logoUrl} alt="Quadra" style={{ position: "absolute", bottom: 40, right: 60, height: 60 }} />}
      <DecorativeShape position="bl" />
    </PageContainer>
  );
}
