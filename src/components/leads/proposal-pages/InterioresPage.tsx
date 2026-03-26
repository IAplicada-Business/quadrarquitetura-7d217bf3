import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, LogoQuadra, type ProposalPageProps } from "./shared";

const BriefingIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke={COLORS.roseMauve} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="22" cy="20" r="7" />
    <circle cx="42" cy="20" r="7" />
    <path d="M10 44c0-7 5-12 12-12h2" />
    <path d="M54 44c0-7-5-12-12-12h-2" />
    <path d="M26 38h12" />
    <path d="M32 32v12" />
  </svg>
);

const PlantaIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke={COLORS.roseMauve} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="48" height="48" rx="2" />
    <line x1="8" y1="32" x2="36" y2="32" />
    <line x1="36" y1="8" x2="36" y2="56" />
    <line x1="36" y1="44" x2="56" y2="44" />
    <rect x="12" y="12" width="8" height="6" rx="1" />
    <rect x="40" y="12" width="8" height="6" rx="1" />
  </svg>
);

const SofaIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke={COLORS.roseMauve} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 38V26a4 4 0 014-4h32a4 4 0 014 4v12" />
    <path d="M8 38a4 4 0 014-4h0v10h40V34h0a4 4 0 014 4v6H8v-6z" />
    <line x1="16" y1="48" x2="16" y2="52" />
    <line x1="48" y1="48" x2="48" y2="52" />
    <path d="M24 30v-4h16v4" />
  </svg>
);

const ComputerIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke={COLORS.roseMauve} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="10" y="10" width="44" height="32" rx="3" />
    <line x1="10" y1="34" x2="54" y2="34" />
    <line x1="32" y1="42" x2="32" y2="50" />
    <line x1="22" y1="50" x2="42" y2="50" />
    <circle cx="32" cy="38" r="1.5" fill={COLORS.roseMauve} />
  </svg>
);

const STEPS = [
  {
    icon: <BriefingIcon />,
    title: "Briefing",
    desc: "Reuniões de alinhamento com escuta ativa de todas as necessidades do cliente",
  },
  {
    icon: <PlantaIcon />,
    title: "Estudo Preliminar",
    desc: "Estudos e opções em planta com possibilidade de revisões",
  },
  {
    icon: <SofaIcon />,
    title: "Anteprojeto",
    desc: "Visualização do ambiente em 3D com materiais",
  },
  {
    icon: <ComputerIcon />,
    title: "Projeto Executivo",
    desc: "Desenhos técnicos para viabilizar a obra",
  },
];

export function ProposalInterioresPage(_props: ProposalPageProps) {
  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div style={{ padding: "60px 44px 44px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Title */}
        <h2
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 36,
            fontWeight: 700,
            color: COLORS.azulMarinho,
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 16,
          }}
        >
          Projeto de Interiores
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            color: COLORS.textoTituloVinho,
            textAlign: "center",
            maxWidth: 420,
            lineHeight: 1.6,
            marginBottom: 60,
          }}
        >
          Desenvolve toda parte conceitual, de fluxo, de organização e estética do local.
        </p>

        {/* Grid 4 columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            width: "100%",
            flex: 1,
            alignContent: "center",
          }}
        >
          {STEPS.map((step) => (
            <div key={step.title} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ marginBottom: 20 }}>{step.icon}</div>
              <h4
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: COLORS.azulMarinho,
                  marginBottom: 10,
                  lineHeight: 1.4,
                }}
              >
                {step.title}
              </h4>
              <p
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 9,
                  color: "#666",
                  lineHeight: 1.6,
                  maxWidth: 110,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
      <LogoQuadra />
    </PageContainer>
  );
}
