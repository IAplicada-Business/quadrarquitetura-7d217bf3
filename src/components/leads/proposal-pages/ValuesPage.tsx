import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, LogoSmall, formatBRL, type ProposalPageProps } from "./shared";

export function ProposalValuesPage(props: ProposalPageProps) {
  const { priceFull, priceCash, installmentsCount, installmentEntry, installmentValue, priceNote, logoUrl } = props;

  const investmentLabel = priceFull ? formatBRL(priceFull) : "A consultar";
  const investmentSub = priceCash && priceFull && priceCash < priceFull
    ? `À vista: ${formatBRL(priceCash)}`
    : "";

  const paymentLabel =
    installmentsCount && installmentValue
      ? `${installmentsCount}x de ${formatBRL(installmentValue)}`
      : "Boleto ou Pix";
  const paymentSub =
    installmentsCount && installmentEntry && installmentEntry > 0
      ? `Entrada: ${formatBRL(installmentEntry)}`
      : installmentsCount ? "" : "Parcelamento disponível";

  return (
    <PageContainer bg={COLORS.azulMarinho} pageWidth={props.pageWidth} pageHeight={props.pageHeight}>
      <div style={{
        padding: "40px 52px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: COLORS.textoClaro,
      }}>
        {/* Title */}
        <h2 style={{
          fontFamily: FONT_TITLE,
          fontSize: 52,
          fontWeight: 600,
          letterSpacing: 8,
          textTransform: "uppercase",
          marginBottom: 24,
          color: COLORS.textoClaro,
        }}>
          Valores
        </h2>

        {/* Divider */}
        <div style={{
          width: 48,
          height: 3,
          background: COLORS.linhaDestaque,
          marginBottom: 48,
        }} />

        {/* Two boxes */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap: 32,
          width: "100%",
          alignItems: "stretch",
          marginBottom: 40,
        }}>
          {/* Investment box */}
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 8,
            padding: "28px 20px",
            textAlign: "center",
          }}>
            <span style={{
              fontFamily: FONT_BODY,
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: COLORS.linhaDestaque,
              marginBottom: 14,
              display: "block",
            }}>
              Investimento Total
            </span>
            <div style={{
              fontFamily: FONT_TITLE,
              fontSize: 36,
              fontWeight: 600,
              color: COLORS.textoClaro,
              lineHeight: 1.2,
            }}>
              {investmentLabel}
            </div>
            {investmentSub && (
              <div style={{
                fontSize: 11,
                opacity: 0.55,
                marginTop: 8,
                color: COLORS.textoClaro,
              }}>
                {investmentSub}
              </div>
            )}
          </div>

          {/* Payment box */}
          <div style={{
            flex: 1,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 8,
            padding: "28px 20px",
            textAlign: "center",
          }}>
            <span style={{
              fontFamily: FONT_BODY,
              fontSize: 9,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: COLORS.linhaDestaque,
              marginBottom: 14,
              display: "block",
            }}>
              Formas de Pagamento
            </span>
            <div style={{
              fontFamily: FONT_TITLE,
              fontSize: 20,
              fontWeight: 600,
              color: COLORS.textoClaro,
              lineHeight: 1.3,
            }}>
              {paymentLabel}
            </div>
            <div style={{
              fontSize: 11,
              opacity: 0.55,
              marginTop: 8,
              color: COLORS.textoClaro,
            }}>
              {paymentSub}
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p style={{
          fontSize: 10,
          opacity: 0.5,
          fontStyle: "italic",
          lineHeight: 1.5,
          color: COLORS.textoClaro,
          maxWidth: 400,
        }}>
          {priceNote || "* Mão de obra e materiais de execução não estão inclusos neste valor."}
        </p>
      </div>
      <LogoSmall url={logoUrl} position="br" />
    </PageContainer>
  );
}
