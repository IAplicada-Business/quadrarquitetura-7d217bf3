import { motion } from "framer-motion";
import { Armchair, ClipboardList, Hammer } from "lucide-react";

const services = [
  {
    icon: ClipboardList,
    title: "Gerenciamento de Obra",
    description:
      "Nosso diferencial. Cronograma, orcamento, compras e supervisao semanal no canteiro — tudo sob nossa gestao direta, com relatorios e previsibilidade em cada etapa.",
  },
  {
    icon: Armchair,
    title: "Design de Interiores",
    description:
      "Projetos autorais com atencao a ambientacao, materiais, iluminacao e marcenaria sob medida — traduzindo a rotina e os afetos de cada cliente.",
  },
  {
    icon: Hammer,
    title: "Reformas turn-key",
    description:
      "Planejamento e execucao de reformas complexas com gestao integrada de fornecedores. Entregamos a chave, nao uma lista de pendencias.",
  },
];

export function ServicesSection() {
  return (
    <section id="servicos" className="relative py-24 md:py-32 bg-[#1B2A4A] overflow-hidden">
      {/* Decorative element */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "#C4756E" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1 }}
          className="text-center mb-16 md:mb-20"
        >
          <p
            className="text-xs mb-5"
            style={{
              color: "#C4756E",
              letterSpacing: "6px",
              fontFamily: "'Jost', sans-serif",
              fontWeight: 500,
            }}
          >
            NOSSOS SERVICOS
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              color: "#F0DCC8",
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            O que fazemos de <em style={{ color: "#C4756E", fontStyle: "italic" }}>melhor</em>
          </h2>
          <div
            className="w-12 h-px mx-auto mt-8"
            style={{ backgroundColor: "#C4756E" }}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#F0DCC8]/10">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className="group relative bg-[#1B2A4A] p-10 md:p-14 transition-all duration-500 hover:bg-[#243558]"
              >
                {/* Number */}
                <span
                  className="absolute top-6 right-8 text-[#C4756E]/30 transition-colors group-hover:text-[#C4756E]/60"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "2rem",
                    fontWeight: 300,
                  }}
                >
                  0{i + 1}
                </span>

                <div
                  className="w-14 h-14 mb-8 flex items-center justify-center border transition-colors duration-500 group-hover:bg-[#C4756E] group-hover:border-[#C4756E]"
                  style={{ borderColor: "#C4756E" }}
                >
                  <Icon
                    className="h-6 w-6 transition-colors duration-500"
                    style={{ color: "#C4756E" }}
                    strokeWidth={1.5}
                  />
                </div>

                <h3
                  className="mb-4 text-[#F0DCC8]"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)",
                    fontWeight: 400,
                    lineHeight: 1.2,
                  }}
                >
                  {s.title}
                </h3>

                <p
                  className="text-[#F0DCC8]/70 max-w-md"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.9375rem",
                    lineHeight: 1.75,
                    fontWeight: 300,
                  }}
                >
                  {s.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
