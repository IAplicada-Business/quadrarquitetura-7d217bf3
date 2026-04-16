import { motion } from "framer-motion";
import foundersPhoto from "@/assets/founders-photo.png";

export function AboutSection() {
  return (
    <section id="sobre" className="relative py-24 md:py-32 bg-[#F5E0D0]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={foundersPhoto}
                alt="Camilla e Mariana"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative frame */}
            <div
              className="absolute -bottom-4 -right-4 w-full h-full border-2 pointer-events-none -z-0"
              style={{ borderColor: "#C4756E" }}
            />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 lg:pl-8"
          >
            <p
              className="text-xs mb-6"
              style={{
                color: "#C4756E",
                letterSpacing: "6px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
              }}
            >
              QUEM SOMOS
            </p>

            <h2
              className="mb-8"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.25rem, 5vw, 4rem)",
                lineHeight: 1.1,
                color: "#8B4557",
                fontWeight: 400,
              }}
            >
              Camilla <span style={{ color: "#C4756E" }}>&</span> Mariana
            </h2>

            <div
              className="w-12 h-px mb-8"
              style={{ backgroundColor: "#C4756E" }}
            />

            <div
              className="space-y-5"
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "clamp(0.95rem, 1.1vw, 1.0625rem)",
                lineHeight: 1.85,
                color: "#1B2A4A",
                fontWeight: 300,
              }}
            >
              <p>
                A Quadra nasceu do encontro de duas arquitetas com um proposito em
                comum: transformar espacos em experiencias que fazem sentido para
                quem os habita. Acreditamos que arquitetura e interiores sao,
                antes de tudo, sobre pessoas.
              </p>
              <p>
                Nosso trabalho parte da escuta. De compreender a rotina, os
                gostos e os afetos de cada cliente para traduzi-los em projetos
                autorais, tecnicos e funcionais. Atuamos com projeto e gestao
                integrada de obra, garantindo que a ideia do papel se materialize
                com qualidade, transparencia e cuidado.
              </p>
              <p>
                Mais que entregar projetos, entregamos a tranquilidade de um
                processo bem conduzido, do briefing a ultima peca instalada.
              </p>
            </div>

            <div
              className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "#8B4557",
                fontSize: "1.125rem",
                fontStyle: "italic",
              }}
            >
              <span>Camilla Quadra</span>
              <span style={{ color: "#C4756E" }}>&middot;</span>
              <span>Arquiteta pela FUMEC</span>
              <span
                className="hidden md:inline w-8 h-px"
                style={{ backgroundColor: "#C4756E" }}
              />
              <span>Mariana Marques</span>
              <span style={{ color: "#C4756E" }}>&middot;</span>
              <span>Arquiteta pela UFMG</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
