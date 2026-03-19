import { PageContainer, COLORS, DecorativeShape, LogoSmall, type ProposalPageProps } from "./shared";
import { Wrench, FileText, Lightbulb, CheckCircle } from "lucide-react";

const ICONS = [Wrench, FileText, Lightbulb, CheckCircle];

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
        <div style={{ display: "flex", justifyContent: "center", gap: 40, maxWidth: 1100, margin: "0 auto" }}>
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div key={i} style={{ textAlign: "center", flex: 1, maxWidth: 240 }}>
                <div style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
                  <Icon size={48} color={COLORS.textoClaro} strokeWidth={1.2} />
                </div>
                <p style={{ color: COLORS.textoClaro, fontSize: 14, fontWeight: 600, textTransform: "uppercase", lineHeight: 1.6 }}>{item}</p>
              </div>
            );
          })}
        </div>
      </div>
      <DecorativeShape position="bl" />
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
