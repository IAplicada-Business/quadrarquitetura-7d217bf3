import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoBege from "@/assets/logo-bege.png";
import logoAzul from "@/assets/logo-azul.png";

const links = [
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Servicos" },
  { href: "#projetos", label: "Projetos" },
  { href: "#processo", label: "Processo" },
  { href: "#contato", label: "Contato" },
];

export function LandingNavbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const smoothTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-6"
      }`}
      style={{ fontFamily: "'Jost', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center"
          aria-label="Quadra Arquitetura"
        >
          <img
            src={scrolled ? logoAzul : logoBege}
            alt="Quadra Arquitetura"
            className="h-16 md:h-20 w-auto transition-opacity duration-300"
          />
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => smoothTo(l.href)}
              className={`text-sm tracking-wider uppercase transition-colors hover:opacity-70 ${
                scrolled ? "text-[#1B2A4A]" : "text-[#F0DCC8]"
              }`}
              style={{ letterSpacing: "2px", fontWeight: 400 }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className={`text-xs tracking-wider uppercase transition-opacity hover:opacity-70 ${
              scrolled ? "text-[#1B2A4A]/60" : "text-[#F0DCC8]/70"
            }`}
            style={{ letterSpacing: "2px" }}
          >
            Area da Equipe
          </button>
          <button
            onClick={() => smoothTo("#contato")}
            className={`px-5 py-2.5 text-xs tracking-wider uppercase transition-all ${
              scrolled
                ? "bg-[#1B2A4A] text-[#F0DCC8] hover:bg-[#2d4373]"
                : "bg-[#F0DCC8] text-[#1B2A4A] hover:bg-white"
            }`}
            style={{ letterSpacing: "2px", fontWeight: 500 }}
          >
            Fale conosco
          </button>
        </div>

        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden" aria-label="Menu">
              <Menu className={`h-6 w-6 ${scrolled ? "text-[#1B2A4A]" : "text-[#F0DCC8]"}`} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#1B2A4A] border-none w-full sm:w-96">
            <div className="flex flex-col h-full pt-8">
              <button onClick={() => setMobileOpen(false)} className="self-end mb-8">
                <X className="h-6 w-6 text-[#F0DCC8]" />
              </button>
              <div className="flex flex-col gap-6 flex-1">
                {links.map((l) => (
                  <button
                    key={l.href}
                    onClick={() => smoothTo(l.href)}
                    className="text-[#F0DCC8] text-lg text-left tracking-wider uppercase"
                    style={{ letterSpacing: "3px", fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-[#F0DCC8]/20 pt-6 flex flex-col gap-4">
                <button
                  onClick={() => smoothTo("#contato")}
                  className="bg-[#F0DCC8] text-[#1B2A4A] py-3 text-sm tracking-widest uppercase"
                  style={{ letterSpacing: "3px" }}
                >
                  Fale conosco
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="text-[#F0DCC8]/70 text-xs tracking-widest uppercase"
                  style={{ letterSpacing: "2px" }}
                >
                  Area da Equipe
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
