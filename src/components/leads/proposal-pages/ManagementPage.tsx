import { PageContainer, COLORS, LogoSmall, type ProposalPageProps } from "./shared";
import { Clock, DollarSign, ShoppingBag, BadgeCheck, CalendarCheck, MapPin } from "lucide-react";

const PILLARS = [
  { icon: Clock, label: "Planejamento" },
  { icon: DollarSign, label: "Orçamento" },
  { icon: ShoppingBag, label: "Aquisição de\nMaterial" },
  { icon: BadgeCheck, label: "Verificação de\nQualidade" },
  { icon: CalendarCheck, label: "Acompanhamento\nda Execução" },
  { icon: MapPin, label: "Gestão de\nPessoas" },
];

export function ProposalManagementPage({ logoUrl }: ProposalPageProps) {
  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: "60px 60px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ color: COLORS.textoEscuro, fontSize: 32, fontWeight: 700, textAlign: "center", textTransform: "uppercase", marginBottom: 16 }}>
          Gerenciamento de Obra
        </h2>
        <p style={{ color: COLORS.textoEscuro, fontSize: 13, textAlign: "center", maxWidth: 600, margin: "0 auto 48px", lineHeight: 1.6, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>
          Organiza, coordena e controla todas as etapas de uma reforma para garantir que seu projeto saia dentro do prazo, do orçamento e da qualidade desejada
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "32px 40px", maxWidth: 560, margin: "0 auto" }}>
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: 70, height: 70, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Icon size={44} color={COLORS.textoTituloVinho} strokeWidth={1.2} />
                </div>
                <p style={{ color: COLORS.textoEscuro, fontSize: 12, fontWeight: 600, textTransform: "uppercase", whiteSpace: "pre-line", lineHeight: 1.3 }}>{p.label}</p>
              </div>
            );
          })}
        </div>
      </div>
      <LogoSmall url={logoUrl} />
    </PageContainer>
  );
}
