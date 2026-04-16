import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import coverImg from "@/assets/socias-cover.jpg";

export function HeroSection() {
  const smoothTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full h-screen min-h-[640px] overflow-hidden">
      {/* Background image with parallax */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <img
          src={coverImg}
          alt="Quadra Arquitetura"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(27,42,74,0.55) 0%, rgba(27,42,74,0.35) 40%, rgba(27,42,74,0.75) 100%)",
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          {/* Kicker */}
          <p
            className="text-[#F0DCC8] text-xs md:text-sm mb-6 md:mb-8"
            style={{
              fontFamily: "'Jost', sans-serif",
              letterSpacing: "8px",
              fontWeight: 300,
            }}
          >
            ARQUITETURA &nbsp;&middot;&nbsp; INTERIORES &nbsp;&middot;&nbsp; OBRAS
          </p>

          {/* Decorative line */}
          <div className="w-16 h-px bg-[#C4756E] mb-8 md:mb-10" />

          {/* Title */}
          <h1
            className="text-[#F0DCC8] mb-6 md:mb-8"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(2.5rem, 7vw, 6rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            Ambientes que contam
            <br />
            <em style={{ fontStyle: "italic", color: "#C4756E" }}>a sua historia.</em>
          </h1>

          {/* Subtitle */}
          <p
            className="text-[#F0DCC8]/85 max-w-2xl mb-10 md:mb-12"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: "clamp(1rem, 1.3vw, 1.25rem)",
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            Projetos autorais de arquitetura e interiores com gestao integrada de obra.
            Uma abordagem tecnica, sensivel e sem amadorismos em Belo Horizonte.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => smoothTo("#contato")}
              className="group bg-[#F0DCC8] text-[#1B2A4A] px-8 py-4 text-xs tracking-widest uppercase transition-all hover:bg-white"
              style={{ letterSpacing: "3px", fontWeight: 500 }}
            >
              <span className="inline-block transition-transform group-hover:translate-x-1">
                Fale conosco &nbsp;&rarr;
              </span>
            </button>
            <button
              onClick={() => smoothTo("#projetos")}
              className="border border-[#F0DCC8]/40 text-[#F0DCC8] px-8 py-4 text-xs tracking-widest uppercase transition-all hover:bg-[#F0DCC8]/10"
              style={{ letterSpacing: "3px", fontWeight: 400 }}
            >
              Nossos projetos
            </button>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          onClick={() => smoothTo("#sobre")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#F0DCC8]/60 flex flex-col items-center gap-2 hover:text-[#F0DCC8] transition-colors"
          aria-label="Rolar para baixo"
        >
          <span
            className="text-[10px] uppercase"
            style={{ letterSpacing: "3px", fontFamily: "'Jost', sans-serif" }}
          >
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
}
