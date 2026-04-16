import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Briefing",
    description: "Escuta ativa para entender rotina, estilo de vida e expectativas do projeto.",
  },
  {
    num: "02",
    title: "Levantamento",
    description: "Medicao tecnica e diagnostico completo do espaco a ser projetado ou reformado.",
  },
  {
    num: "03",
    title: "Anteprojeto",
    description: "Estudo preliminar com plantas, cortes e referencias visuais para validacao.",
  },
  {
    num: "04",
    title: "Projeto Executivo",
    description: "Detalhamento tecnico completo: eletrica, hidraulica, marcenaria e acabamentos.",
  },
  {
    num: "05",
    title: "Obra",
    description: "Gestao integrada com cronograma, orcamento e supervisao semanal no canteiro.",
  },
  {
    num: "06",
    title: "Entrega",
    description: "Vistoria final, ajustes e entrega de um ambiente pronto para ser habitado.",
  },
];

export function ProcessSection() {
  return (
    <section id="processo" className="relative py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-16 md:mb-24"
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
            METODOLOGIA
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              color: "#1B2A4A",
              fontWeight: 300,
              lineHeight: 1.1,
            }}
          >
            Como <em style={{ color: "#C4756E", fontStyle: "italic" }}>trabalhamos</em>
          </h2>
          <p
            className="mt-6 max-w-2xl mx-auto"
            style={{
              fontFamily: "'Jost', sans-serif",
              color: "#1B2A4A",
              opacity: 0.7,
              fontSize: "1rem",
              lineHeight: 1.8,
              fontWeight: 300,
            }}
          >
            Um processo claro e bem conduzido, do primeiro encontro a entrega das chaves.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Horizontal line on desktop */}
          <div
            className="hidden lg:block absolute top-10 left-[8%] right-[8%] h-px"
            style={{ backgroundColor: "#C4756E", opacity: 0.3 }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="relative text-center"
              >
                {/* Dot on timeline */}
                <div
                  className="hidden lg:block absolute top-10 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full -translate-y-1/2 z-10"
                  style={{ backgroundColor: "#C4756E" }}
                />

                <div
                  className="inline-block relative"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "3.5rem",
                    color: "#1B2A4A",
                    fontWeight: 300,
                    lineHeight: 1,
                    opacity: 0.15,
                  }}
                >
                  {s.num}
                </div>

                <h3
                  className="mb-3 mt-4"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.5rem",
                    color: "#8B4557",
                    fontWeight: 500,
                  }}
                >
                  {s.title}
                </h3>

                <p
                  className="max-w-[240px] mx-auto"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "0.875rem",
                    color: "#1B2A4A",
                    opacity: 0.7,
                    lineHeight: 1.7,
                    fontWeight: 300,
                  }}
                >
                  {s.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
