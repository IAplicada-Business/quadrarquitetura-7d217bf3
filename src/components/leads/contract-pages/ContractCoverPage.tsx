import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, LogoQuadra } from "./shared";

interface Props {
  contractNumber: string;
  clientName: string;
  projectName: string;
}

export function ContractCoverPage({ contractNumber, clientName, projectName }: Props) {
  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60 }}>
        {/* Quadra text logo */}
        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 28, letterSpacing: 12, color: COLORS.textoClaro, opacity: 0.3, marginBottom: 60 }}>
          QUADRA
        </div>

        <div style={{ width: 80, height: 1, background: COLORS.linhaDestaque, marginBottom: 40 }} />

        <h1 style={{ fontFamily: FONT_TITLE, fontWeight: 300, fontSize: 28, color: COLORS.textoClaro, textAlign: "center", letterSpacing: 6, lineHeight: 1.4, marginBottom: 8 }}>
          CONTRATO DE
        </h1>
        <h1 style={{ fontFamily: FONT_TITLE, fontWeight: 300, fontSize: 28, color: COLORS.textoClaro, textAlign: "center", letterSpacing: 6, lineHeight: 1.4, marginBottom: 32 }}>
          PRESTAÇÃO DE SERVIÇOS
        </h1>

        <div style={{ width: 80, height: 1, background: COLORS.linhaDestaque, marginBottom: 40 }} />

        {projectName && (
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.textoClaro, opacity: 0.7, letterSpacing: 3, textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
            {projectName}
          </p>
        )}

        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.begeClaro, letterSpacing: 2, textAlign: "center" }}>
          {clientName || "—"}
        </p>

        <p style={{ fontFamily: FONT_BODY, fontSize: 9, color: COLORS.textoClaro, opacity: 0.4, marginTop: 40, letterSpacing: 2 }}>
          {contractNumber}
        </p>
      </div>
      <LogoQuadra />
    </PageContainer>
  );
}
