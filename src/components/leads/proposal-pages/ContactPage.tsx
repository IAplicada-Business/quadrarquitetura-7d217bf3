import { PageContainer, COLORS, DecorativeShape, LogoSmall, type ProposalPageProps } from "./shared";

export function ProposalContactPage({ contactInstagram, contactPhone1, contactPhone2, logoUrl }: ProposalPageProps) {
  return (
    <PageContainer bg={COLORS.roseMauve}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 24, fontWeight: 600, textTransform: "uppercase", marginBottom: 32, letterSpacing: 2 }}>
          Siga a gente nas redes sociais:
        </h2>
        <p style={{ color: COLORS.textoClaro, fontSize: 28, fontWeight: 700, marginBottom: 32 }}>
          {contactInstagram || "@quadraarq"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ color: COLORS.textoClaro, fontSize: 18 }}>{contactPhone1 || "(31) 97264-1970 (Camilla)"}</p>
          <p style={{ color: COLORS.textoClaro, fontSize: 18 }}>{contactPhone2 || "(31) 9124-4672 (Mariana)"}</p>
        </div>
      </div>
      <DecorativeShape position="br" />
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
