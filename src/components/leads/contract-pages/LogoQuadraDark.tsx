import { FONT_BODY, COLORS } from "@/components/leads/proposal-pages/shared";

export function LogoQuadraDark() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        right: 28,
        fontFamily: FONT_BODY,
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: 3,
        color: COLORS.azulMarinho,
        opacity: 0.3,
        lineHeight: 1,
        textAlign: "right",
      }}
    >
      QUA
      <small style={{ fontSize: 8, letterSpacing: 4, display: "block", marginTop: 2, fontWeight: 300 }}>DRA</small>
    </div>
  );
}
