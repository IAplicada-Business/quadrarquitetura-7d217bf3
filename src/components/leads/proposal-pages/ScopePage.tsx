import { PageContainer, COLORS, LogoSmall, type ProposalPageProps } from "./shared";

export function ProposalScopePage({ scopeDescription, logoUrl }: ProposalPageProps) {
  const renderText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ fontWeight: 700, color: COLORS.textoTituloVinho }}>{part}</strong>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: "80px 120px", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
        <h2 style={{ color: COLORS.textoEscuro, fontSize: 36, fontWeight: 700, textAlign: "center", textTransform: "uppercase", marginBottom: 48 }}>
          O que está sendo contemplado
        </h2>
        <p style={{ color: COLORS.textoEscuro, fontSize: 20, lineHeight: 1.8, textAlign: "center", maxWidth: 1000, margin: "0 auto" }}>
          {renderText(scopeDescription || "")}
        </p>
      </div>
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
