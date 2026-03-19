import { PageContainer, COLORS, LogoSmall, DecorativeShape, formatBRL, type ProposalPageProps } from "./shared";

export function ProposalValuesPage(props: ProposalPageProps) {
  const { priceFull, priceCash, installmentsCount, installmentEntry, installmentValue, priceNote, logoUrl } = props;
  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ padding: "80px 120px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 52, fontWeight: 700, textTransform: "uppercase", marginBottom: 48 }}>VALORES</h2>

        <div style={{ marginBottom: 32 }}>
          <p style={{ color: COLORS.textoClaro, fontSize: 42, fontWeight: 700 }}>{formatBRL(priceFull)}</p>
          <div style={{ width: 200, height: 3, background: COLORS.linhaDestaque, marginTop: 12, marginBottom: 16 }} />
          {priceCash && <p style={{ color: COLORS.textoClaro, fontSize: 32, fontWeight: 500, opacity: 0.9 }}>à vista: {formatBRL(priceCash)}</p>}
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
