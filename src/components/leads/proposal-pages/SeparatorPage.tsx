import { PageContainer, COLORS, DecorativeShape, type ProposalPageProps } from "./shared";

export function ProposalSeparatorPage({ title }: { title: string } & Partial<ProposalPageProps>) {
  return (
    <PageContainer bg={COLORS.roseMauve}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 52, fontWeight: 700, textTransform: "uppercase", letterSpacing: 6 }}>
          {title}
        </h2>
      </div>
      <DecorativeShape position="br" color={COLORS.textoClaro + "40"} />
    </PageContainer>
  );
}
