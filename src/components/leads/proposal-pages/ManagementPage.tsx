import { PageContainer, COLORS, type ProposalPageProps } from "./shared";
import { Clock, DollarSign, ShoppingBag, BadgeCheck, CalendarCheck, MapPin } from "lucide-react";

const PILLARS = [
  { icon: Clock, label: "Planejamento" },
  { icon: DollarSign, label: "Orçamento" },
  { icon: ShoppingBag, label: "Aquisição de\nMaterial" },
  { icon: BadgeCheck, label: "Verificação de\nQualidade" },
  { icon: CalendarCheck, label: "Acompanhamento\nda Execução" },
  { icon: MapPin, label: "Gestão de\nPessoas" },
];

export function ProposalManagementPage(_props: ProposalPageProps) {
  return (
    <PageContainer bg={COLORS.azulMarinho}>
      <div style={{ padding: "80px 80px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 42, fontWeight: 700, textAlign: "center", textTransform: "uppercase", marginBottom: 20 }}>
          Gerenciamento de Obra
        </h2>
        <p style={{ color: COLORS.textoClaro, fontSize: 16, textAlign: "center", maxWidth: 900, margin: "0 auto 60px", lineHeight: 1.6, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>
          Organiza, coordena e controla todas as etapas de uma reforma para garantir que seu projeto saia dentro do prazo, do orçamento e da qualidade desejada
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 40 }}>
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} style={{ textAlign: "center", width: 160 }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", border: `2px solid ${COLORS.textoClaro}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Icon size={36} color={COLORS.textoClaro} strokeWidth={1.5} />
                </div>
                <p style={{ color: COLORS.textoClaro, fontSize: 13, fontWeight: 600, textTransform: "uppercase", whiteSpace: "pre-line", lineHeight: 1.3 }}>{p.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
