import { PageContainer, COLORS, LogoSmall, DecorativeShape, type ProposalPageProps } from "./shared";
import { Clock, DollarSign, ShoppingBag, BadgeCheck, CalendarCheck, MapPin, type LucideIcon } from "lucide-react";

const PILLAR_CONFIG: Record<string, { icon: LucideIcon; title: string; textKey: string }> = {
  planejamento: { icon: Clock, title: "PLANEJAMENTO", textKey: "pilar_planejamento" },
  orcamento: { icon: DollarSign, title: "ORÇAMENTO", textKey: "pilar_orcamento" },
  aquisicao: { icon: ShoppingBag, title: "AQUISIÇÃO DE MATERIAL", textKey: "pilar_aquisicao" },
  qualidade: { icon: BadgeCheck, title: "VERIFICAÇÃO DE QUALIDADE", textKey: "pilar_qualidade" },
  execucao: { icon: CalendarCheck, title: "ACOMPANHAMENTO DA EXECUÇÃO", textKey: "pilar_execucao" },
  pessoas: { icon: MapPin, title: "GESTÃO DE PESSOAS", textKey: "pilar_pessoas" },
};

interface PillarPageProps extends ProposalPageProps {
  pillarKey: string;
}

export function ProposalPillarPage({ pillarKey, pillarTexts, logoUrl }: PillarPageProps) {
  const config = PILLAR_CONFIG[pillarKey];
  if (!config) return null;

  const Icon = config.icon;
  const text = pillarTexts?.[config.textKey] || "";
  const bullets = text.split("\n").filter(l => l.trim());

  return (
    <PageContainer bg={COLORS.roseMauve}>
      {/* Large icon */}
      <div style={{ position: "absolute", top: 50, left: 60 }}>
        <Icon size={80} color={COLORS.textoClaro} strokeWidth={1} style={{ opacity: 0.7 }} />
      </div>

      <div style={{ padding: "60px 60px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Title */}
        <h2 style={{ color: COLORS.textoClaro, fontSize: 26, fontWeight: 700, textTransform: "uppercase", lineHeight: 1.2, marginBottom: 32, paddingTop: 60 }}>
          {config.title}
        </h2>

        {/* Bullets */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
          {bullets.map((bullet, i) => (
            <p key={i} style={{ color: COLORS.textoClaro, fontSize: 15, lineHeight: 1.8, marginBottom: 4 }}>
              {bullet.startsWith("•") ? bullet : `• ${bullet}`}
            </p>
          ))}
        </div>
      </div>

      <DecorativeShape position="br" />
      <LogoSmall url={logoUrl} position="bl" />
    </PageContainer>
  );
}

export const PILLAR_KEYS = Object.keys(PILLAR_CONFIG);
