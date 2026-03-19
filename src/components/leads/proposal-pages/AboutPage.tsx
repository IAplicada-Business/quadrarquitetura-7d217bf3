import { PageContainer, COLORS, LogoSmall, type ProposalPageProps } from "./shared";
import foundersPhoto from "@/assets/founders-photo.png";

const DEFAULT_ABOUT = "A Quadra é uma empresa que nasceu em 2022 pela inquietação da seguinte pergunta: como fazer com que nossos clientes tenham no final da sua obra seu projeto exatamente igual ao do 3d? Assim, desenvolvemos também o serviço de gerenciamento de obra no qual oferecemos aos nossos clientes assessoria completa pra ter seu espaço do jeitinho que ele sempre sonhou.";

export function ProposalAboutPage({ aboutText, logoUrl }: ProposalPageProps) {
  return (
    <PageContainer bg={COLORS.begeClaro}>
      {/* Watermark */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-15deg)", fontSize: 60, fontWeight: 800, color: COLORS.textoTituloVinho, opacity: 0.05, whiteSpace: "nowrap", pointerEvents: "none" }}>
        QUADRA ARQUITETURA
      </div>

      <div style={{ padding: "60px 60px", display: "flex", flexDirection: "column", height: "100%", position: "relative", zIndex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Title */}
        <div style={{ width: "100%", marginBottom: 32 }}>
          <h2 style={{ color: COLORS.textoTituloVinho, fontSize: 32, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Quem Somos</h2>
          <div style={{ width: 60, height: 3, background: COLORS.linhaDestaque, marginBottom: 24 }} />
          <p style={{ color: COLORS.textoEscuro, fontSize: 15, lineHeight: 1.7 }}>
            {aboutText || DEFAULT_ABOUT}
          </p>
        </div>

        {/* Group photo */}
        <div style={{ width: 500, height: 400, borderRadius: 12, overflow: "hidden", marginBottom: 32, border: `3px solid ${COLORS.shapeBege}` }}>
          <img src={foundersPhoto} alt="Camilla e Mariana" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "20% 0%" }} />
        </div>

        {/* Bios side by side */}
        <div style={{ display: "flex", justifyContent: "center", gap: 80, width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <h3 style={{ color: COLORS.textoTituloVinho, fontSize: 16, fontWeight: 700, textTransform: "uppercase" }}>Camilla</h3>
            <p style={{ color: COLORS.textoEscuro, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>Formada em Arquitetura pela FUMEC, 2018</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <h3 style={{ color: COLORS.textoTituloVinho, fontSize: 16, fontWeight: 700, textTransform: "uppercase" }}>Mariana</h3>
            <p style={{ color: COLORS.textoEscuro, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>Formada em Arquitetura pela UFMG, 2021<br />Pós Graduação em Arquitetura Hospitalar</p>
          </div>
        </div>
      </div>
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
