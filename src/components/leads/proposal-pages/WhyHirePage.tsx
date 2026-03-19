import { PageContainer, COLORS, DecorativeShape, LogoSmall, type ProposalPageProps } from "./shared";

export function ProposalWhyHirePage({ differentials, logoUrl }: ProposalPageProps) {
  const items = differentials || [
    "ALINHAMENTO DA TÉCNICA COM A ESTÉTICA",
    "FIDELIDADE TOTAL AO PROJETO",
    "TRANSFORMAMOS O CONCEITO EM SOLUÇÃO",
    "PRESENÇA CONSTANTE NA OBRA DA FASE INICIAL ATÉ A INSTALAÇÃO DE ELETROS, METAIS E PEQUENOS DETALHES",
  ];

  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ padding: "80px 80px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 32, fontWeight: 700, textAlign: "center", textTransform: "uppercase", marginBottom: 60, lineHeight: 1.3 }}>
          Por que contratar arquitetos<br />para gerenciar a sua obra?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
          {items.map((item, i) => (
            <div key={i} style={{
              border: `1px solid ${COLORS.textoClaro}40`,
              borderRadius: 12,
              padding: "32px 28px",
              textAlign: "center",
            }}>
              <p style={{ color: COLORS.textoClaro, fontSize: 16, fontWeight: 600, textTransform: "uppercase", lineHeight: 1.5 }}>{item}</p>
            </div>
          ))}
        </div>
      </div>
      <DecorativeShape position="bl" />
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
