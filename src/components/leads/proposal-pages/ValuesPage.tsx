import { PageContainer, COLORS, LogoSmall, DecorativeShape, formatBRL, type ProposalPageProps } from "./shared";

export function ProposalValuesPage(props: ProposalPageProps) {
  const { priceFull, priceCash, installmentsCount, installmentEntry, installmentValue, priceNote, logoUrl } = props;
  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ padding: "60px 60px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 36, fontWeight: 700, textTransform: "uppercase", marginBottom: 40 }}>VALORES</h2>

        <div style={{ marginBottom: 28 }}>
          {priceCash && priceFull && priceCash < priceFull && (
            <p style={{ color: COLORS.textoClaro, fontSize: 26, fontWeight: 500, opacity: 0.7, textDecoration: "line-through", textDecorationColor: COLORS.linhaDestaque, textDecorationThickness: 3, marginBottom: 8 }}>
              {formatBRL(priceFull)}
            </p>
          )}
          <p style={{ color: COLORS.textoClaro, fontSize: 36, fontWeight: 700 }}>{formatBRL(priceCash || priceFull)}</p>
          <div style={{ width: 160, height: 3, background: COLORS.linhaDestaque, margin: "14px auto" }} />
          {priceCash && priceFull && priceCash < priceFull && (
            <p style={{ color: COLORS.textoClaro, fontSize: 16, opacity: 0.8 }}>à vista</p>
          )}
        </div>

        {installmentsCount && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ color: COLORS.textoClaro, fontSize: 18, fontWeight: 700, textTransform: "uppercase", marginBottom: 14 }}>Formas de Pagamento:</h3>
            <div style={{ color: COLORS.textoClaro, fontSize: 15, lineHeight: 2 }}>
              <p>• à vista: {formatBRL(priceCash)}</p>
              <p>• parcelado em até {installmentsCount}x</p>
              {installmentEntry && <p>• entrada (assinatura do contrato) de {formatBRL(installmentEntry)}</p>}
              {installmentValue && installmentsCount > 1 && <p>• + {installmentsCount - 1} parcelas mensais de {formatBRL(installmentValue)}</p>}
            </div>
          </div>
        )}

        {priceNote && <p style={{ color: COLORS.textoClaro, fontSize: 13, opacity: 0.7, fontStyle: "italic" }}>{priceNote}</p>}
      </div>
      <LogoSmall url={logoUrl} position="bl" />
    </PageContainer>
  );
}
