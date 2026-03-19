import { PageContainer, COLORS, LogoSmall, type ProposalPageProps } from "./shared";

export function ProposalAboutPage({ aboutText, founderPhotos, logoUrl }: ProposalPageProps) {
  const photo1 = founderPhotos?.[0];
  const photo2 = founderPhotos?.[1];
  return (
    <PageContainer bg={COLORS.begeClaro}>
      {/* Watermark */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-15deg)", fontSize: 120, fontWeight: 800, color: COLORS.textoTituloVinho, opacity: 0.05, whiteSpace: "nowrap", pointerEvents: "none" }}>
        QUADRA ARQUITETURA
      </div>

      <div style={{ padding: "60px 80px", display: "flex", gap: 60, height: "100%", position: "relative", zIndex: 1 }}>
        {/* Left: text */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ color: COLORS.textoTituloVinho, fontSize: 42, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Quem Somos</h2>
          <div style={{ width: 80, height: 3, background: COLORS.linhaDestaque, marginBottom: 32 }} />
          <p style={{ color: COLORS.textoEscuro, fontSize: 18, lineHeight: 1.7 }}>
            {aboutText || "A Quadra é uma empresa que nasceu em 2022..."}
          </p>
        </div>

        {/* Right: photos */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 32, minWidth: 280 }}>
          {[photo1, photo2].map((photo, i) => photo && (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ width: 160, height: 160, borderRadius: "50%", overflow: "hidden", margin: "0 auto", border: `3px solid ${COLORS.shapeBege}` }}>
                <img src={photo.file_url || ""} alt={photo.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <h3 style={{ color: COLORS.textoTituloVinho, fontSize: 22, fontWeight: 700, marginTop: 12, textTransform: "uppercase" }}>{photo.name}</h3>
              <p style={{ color: COLORS.textoEscuro, fontSize: 13, marginTop: 4 }}>{photo.description}</p>
            </div>
          ))}
        </div>
      </div>
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
