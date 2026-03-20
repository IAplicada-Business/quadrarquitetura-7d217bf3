import { PageContainer, COLORS, FONT_TITLE, FONT_BODY, PAGE_H, type ProposalPageProps } from "./shared";
import foundersPhoto from "@/assets/founders-photo.png";

const DEFAULT_ABOUT =
  "A Quadra nasceu em 2022 da seguinte pergunta: como garantir que o cliente tenha, no final da obra, o resultado exatamente igual ao projeto 3D? Desenvolvemos um serviço de gerenciamento completo para que cada detalhe seja executado do jeito que sempre foi sonhado.";

export function ProposalAboutPage({ aboutText, logoUrl }: ProposalPageProps) {
  return (
    <PageContainer bg={COLORS.begeClaro}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          height: PAGE_H,
        }}
      >
        {/* Left: photo column */}
        <div style={{ overflow: "hidden", height: PAGE_H, flexShrink: 0 }}>
          <img
            src={foundersPhoto}
            alt="Camilla e Mariana"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              marginTop: -40,
            }}
          />
        </div>

        {/* Right: text column */}
        <div
          style={{
            padding: "56px 36px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Tag */}
          <div
            style={{
              fontSize: 9,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: COLORS.linhaDestaque,
              fontWeight: 500,
              marginBottom: 12,
            }}
          >
            Sobre nós
          </div>

          {/* Title */}
          <h2
            style={{
              fontFamily: FONT_TITLE,
              fontSize: 38,
              fontWeight: 600,
              color: COLORS.textoTituloVinho,
              lineHeight: 1.1,
              marginBottom: 20,
              textDecoration: "underline",
              textDecorationColor: COLORS.linhaDestaque,
              textUnderlineOffset: 5,
              textDecorationThickness: 1.5,
            }}
          >
            Quem Somos
          </h2>

          {/* Body text */}
          <p
            style={{
              fontSize: 12.5,
              color: COLORS.textoEscuro,
              lineHeight: 1.75,
              marginBottom: 28,
            }}
          >
            {aboutText || DEFAULT_ABOUT}
          </p>

          {/* Founders list */}
          <div
            style={{
              borderTop: `1px solid ${COLORS.linhaDestaque}`,
              paddingTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <h4
                style={{
                  fontFamily: FONT_TITLE,
                  fontWeight: 600,
                  fontSize: 15,
                  color: COLORS.textoTituloVinho,
                  letterSpacing: 1,
                  marginBottom: 0,
                }}
              >
                Camilla
              </h4>
              <p style={{ fontSize: 11, color: "#666", lineHeight: 1.5, marginBottom: 0 }}>
                Formada em Arquitetura pela FUMEC, 2018
              </p>
            </div>
            <div>
              <h4
                style={{
                  fontFamily: FONT_TITLE,
                  fontWeight: 600,
                  fontSize: 15,
                  color: COLORS.textoTituloVinho,
                  letterSpacing: 1,
                  marginBottom: 0,
                }}
              >
                Mariana
              </h4>
              <p style={{ fontSize: 11, color: "#666", lineHeight: 1.5, marginBottom: 0 }}>
                Formada em Arquitetura pela UFMG, 2021
                <br />
                Pós-graduação em Arquitetura Hospitalar
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
