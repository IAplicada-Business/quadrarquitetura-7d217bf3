import { PageContainer, COLORS, LogoSmall, DecorativeShape, formatBRL, type ProposalPageProps } from "./shared";

export function ProposalValuesPage(props: ProposalPageProps) {
  const { priceFull, priceCash, installmentsCount, installmentEntry, installmentValue, priceNote, logoUrl } = props;
  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ padding: "80px 120px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 52, fontWeight: 700, textTransform: "uppercase", marginBottom: 48 }}>VALORES</h2>

        <div style={{ marginBottom: 32 }}>
          {/* Full price with strikethrough */}
          {priceCash && priceFull && priceCash < priceFull && (
            <p style={{ color: COLORS.textoClaro, fontSize: 32, fontWeight: 500, opacity: 0.7, textDecoration: "line-through", textDecorationColor: COLORS.linhaDestaque, textDecorationThickness: 3, marginBottom: 8 }}>
              {formatBRL(priceFull)}
            </p>
          )}
          <p style={{ color: COLORS.textoClaro, fontSize: 48, fontWeight: 700 }}>{formatBRL(priceCash || priceFull)}</p>
          <div style={{ width: 200, height: 3, background: COLORS.linhaDestaque, margin: "16px auto" }} />
          {priceCash && priceFull && priceCash < priceFull && (
            <p style={{ color: COLORS.textoClaro, fontSize: 18, opacity: 0.8 }}>à vista</p>
          )}
        </div>

        {installmentsCount && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ color: COLORS.textoClaro, fontSize: 22, fontWeight: 700, textTransform: "uppercase", marginBottom: 16 }}>Formas de Pagamento:</h3>
            <div style={{ color: COLORS.textoClaro, fontSize: 18, lineHeight: 2 }}>
              <p>• à vista: {formatBRL(priceCash)}</p>
              <p>• parcelado em até {installmentsCount}x</p>
              {installmentEntry && <p>• entrada (assinatura do contrato) de {formatBRL(installmentEntry)}</p>}
              {installmentValue && installmentsCount > 1 && <p>• + {installmentsCount - 1} parcelas mensais de {formatBRL(installmentValue)}</p>}
            </div>
          </div>
        )}

        {priceNote && <p style={{ color: COLORS.textoClaro, fontSize: 14, opacity: 0.7, fontStyle: "italic" }}>{priceNote}</p>}
      </div>
      <LogoSmall url={logoUrl} position="bl" />
    </PageContainer>
  );
}
