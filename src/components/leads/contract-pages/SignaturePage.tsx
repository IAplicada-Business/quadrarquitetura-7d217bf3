import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, LogoQuadra, type ContractPageProps, formatContractDate } from "./shared";
import { CONTRATADA_INFO } from "@/data/defaultContractClauses";

export function SignaturePage(props: ContractPageProps) {
  const dateText = props.signatureDate
    ? formatContractDate(props.signatureDate)
    : "_____ de _____________ de _______";

  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ padding: 60, display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
        {/* Date and city */}
        <p style={{ fontFamily: FONT_BODY, fontSize: 10, color: COLORS.textoClaro, textAlign: "center", marginBottom: 60, opacity: 0.8 }}>
          {props.foro || `${CONTRATADA_INFO.cidade}/${CONTRATADA_INFO.estado}`}, {dateText}
        </p>

        <p style={{ fontFamily: FONT_BODY, fontSize: 8, color: COLORS.textoClaro, textAlign: "center", marginBottom: 50, opacity: 0.5 }}>
          Os Signatários indicados no Quadro Resumo assinam este Contrato.
        </p>

        {/* Signature blocks */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40, marginBottom: 60 }}>
          {/* Contratante */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ borderTop: `1px solid ${COLORS.linhaDestaque}`, width: "100%", marginBottom: 8 }} />
            <p style={{ fontFamily: FONT_TITLE, fontWeight: 600, fontSize: 10, color: COLORS.textoClaro, letterSpacing: 2, marginBottom: 4 }}>
              CONTRATANTE
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 8, color: COLORS.textoClaro, opacity: 0.7 }}>
              {props.signatarioContratanteName || props.clientName || "________"}
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 7, color: COLORS.textoClaro, opacity: 0.5 }}>
              CPF/CNPJ: {props.clientCpfCnpj || "________"}
            </p>
          </div>

          {/* Contratada */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ borderTop: `1px solid ${COLORS.linhaDestaque}`, width: "100%", marginBottom: 8 }} />
            <p style={{ fontFamily: FONT_TITLE, fontWeight: 600, fontSize: 10, color: COLORS.textoClaro, letterSpacing: 2, marginBottom: 4 }}>
              CONTRATADA
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 8, color: COLORS.textoClaro, opacity: 0.7 }}>
              {props.signatarioContratadaName || "________"}
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 7, color: COLORS.textoClaro, opacity: 0.5 }}>
              CNPJ: {CONTRATADA_INFO.cnpj}
            </p>
          </div>
        </div>

        {/* Witnesses */}
        <p style={{ fontFamily: FONT_BODY, fontSize: 8, color: COLORS.textoClaro, textAlign: "center", opacity: 0.5, marginBottom: 30 }}>
          Testemunhas:
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 40 }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ borderTop: `1px solid rgba(196,117,110,0.4)`, width: "100%", marginBottom: 6 }} />
            <p style={{ fontFamily: FONT_BODY, fontSize: 7, color: COLORS.textoClaro, opacity: 0.5 }}>
              1ª Testemunha
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 6.5, color: COLORS.textoClaro, opacity: 0.4 }}>
              Nome: ________________________
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 6.5, color: COLORS.textoClaro, opacity: 0.4 }}>
              CPF: ________________________
            </p>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ borderTop: `1px solid rgba(196,117,110,0.4)`, width: "100%", marginBottom: 6 }} />
            <p style={{ fontFamily: FONT_BODY, fontSize: 7, color: COLORS.textoClaro, opacity: 0.5 }}>
              2ª Testemunha
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 6.5, color: COLORS.textoClaro, opacity: 0.4 }}>
              Nome: ________________________
            </p>
            <p style={{ fontFamily: FONT_BODY, fontSize: 6.5, color: COLORS.textoClaro, opacity: 0.4 }}>
              CPF: ________________________
            </p>
          </div>
        </div>
      </div>
      <LogoQuadra />
    </PageContainer>
  );
}
