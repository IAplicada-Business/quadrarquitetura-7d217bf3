import { PageContainer, COLORS, LogoSmall, formatBRL, type ProposalPageProps } from "./shared";

export function ProposalValuesPage(props: ProposalPageProps) {
  const { priceFull, priceCash, installmentsCount, installmentEntry, installmentValue, priceNote, logoUrl } = props;
  const hasCashDiscount = priceCash != null && priceFull != null && priceCash < priceFull;
  const mainPrice = priceCash ?? priceFull;

  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ padding: "60px 60px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 36, fontWeight: 700, textTransform: "uppercase", marginBottom: 40 }}>VALORES</h2>

        <div style={{ marginBottom: 28 }}>
          {priceFull != null && (
            <p style={{
              color: COLORS.textoClaro,
              fontSize: hasCashDiscount ? 26 : 36,
              fontWeight: hasCashDiscount ? 500 : 700,
              opacity: hasCashDiscount ? 0.7 : 1,
              textDecoration: hasCashDiscount ? "line-through" : "none",
              textDecorationColor: COLORS.linhaDestaque,
              textDecorationThickness: 3,
              marginBottom: hasCashDiscount ? 8 : 0,
            }}>
              {formatBRL(priceFull)}
            </p>
          )}
          {hasCashDiscount && (
            <>
              <p style={{ color: COLORS.textoClaro, fontSize: 36, fontWeight: 700 }}>{formatBRL(priceCash)}</p>
              <p style={{ color: COLORS.textoClaro, fontSize: 16, opacity: 0.8, marginTop: 4 }}>à vista</p>
            </>
          )}
          <div style={{ width: 160, height: 3, background: COLORS.linhaDestaque, margin: "14px auto" }} />
        </div>

        {(installmentsCount || hasCashDiscount) && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ color: COLORS.textoClaro, fontSize: 18, fontWeight: 700, textTransform: "uppercase", marginBottom: 14 }}>Formas de Pagamento:</h3>
            <div style={{ color: COLORS.textoClaro, fontSize: 15, lineHeight: 2 }}>
              {hasCashDiscount && <p>• à vista: {formatBRL(priceCash)}</p>}
              {installmentsCount && <p>• parcelado em até {installmentsCount}x</p>}
              {installmentEntry != null && <p>• entrada (assinatura do contrato) de {formatBRL(installmentEntry)}</p>}
              {installmentValue != null && installmentsCount && installmentsCount > 1 && (
                <p>• + {installmentsCount - 1} parcelas mensais de {formatBRL(installmentValue)}</p>
              )}
            </div>
          </div>
        )}

        {priceNote && <p style={{ color: COLORS.textoClaro, fontSize: 13, opacity: 0.7, fontStyle: "italic" }}>{priceNote}</p>}
      </div>
      <LogoSmall url={logoUrl} position="bl" />
    </PageContainer>
  );
}
