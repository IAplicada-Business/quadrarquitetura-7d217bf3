import { Instagram } from "lucide-react";
import logoLight from "@/assets/logo-light.png";

const year = new Date().getFullYear();

export function LandingFooter() {
  const smoothTo = (href: string) =>
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer className="bg-[#0F1A2E] text-[#F0DCC8] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 pb-12 border-b border-[#F0DCC8]/10">
          {/* Brand */}
          <div>
            <img src={logoLight} alt="Quadra Arquitetura" className="h-10 w-auto mb-6" />
            <p
              className="max-w-xs"
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "0.875rem",
                lineHeight: 1.8,
                opacity: 0.7,
                fontWeight: 300,
              }}
            >
              Arquitetura, interiores e gestao de obras. Projetos autorais em Belo Horizonte/MG.
            </p>
          </div>

          {/* Nav */}
          <div>
            <p
              className="text-xs mb-5"
              style={{
                color: "#C4756E",
                letterSpacing: "4px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            >
              Navegacao
            </p>
            <ul className="space-y-3">
              {[
                { href: "#sobre", label: "Sobre" },
                { href: "#servicos", label: "Servicos" },
                { href: "#projetos", label: "Projetos" },
                { href: "#processo", label: "Processo" },
                { href: "#contato", label: "Contato" },
              ].map((l) => (
                <li key={l.href}>
                  <button
                    onClick={() => smoothTo(l.href)}
                    className="opacity-70 hover:opacity-100 transition-opacity text-sm"
                    style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p
              className="text-xs mb-5"
              style={{
                color: "#C4756E",
                letterSpacing: "4px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
                textTransform: "uppercase",
              }}
            >
              Contato
            </p>
            <ul
              className="space-y-3 text-sm"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}
            >
              <li className="opacity-70">Rua Euler, 10 · sala 301</li>
              <li className="opacity-70">Padre Eustaquio · Belo Horizonte/MG</li>
              <li className="opacity-70">CEP 30720-160</li>
              <li>
                <a
                  href="mailto:contato@quadraarquitetura.com"
                  className="opacity-70 hover:opacity-100 transition-opacity"
                >
                  contato@quadraarquitetura.com
                </a>
              </li>
              <li className="pt-2">
                <a
                  href="https://instagram.com/quadraarq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Instagram className="h-4 w-4" strokeWidth={1.5} />
                  @quadraarq
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs"
          style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, opacity: 0.5 }}
        >
          <p>&copy; {year} Quadra Arquitetura Ltda &middot; CNPJ 46.731.679/0001-90</p>
          <p style={{ letterSpacing: "2px", textTransform: "uppercase" }}>
            Belo Horizonte · MG · Brasil
          </p>
        </div>
      </div>
    </footer>
  );
}
