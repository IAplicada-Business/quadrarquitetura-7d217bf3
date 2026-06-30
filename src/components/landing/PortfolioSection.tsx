import { motion } from "framer-motion";
import { ArrowUpRight, Instagram } from "lucide-react";
import { useProposalAssets } from "@/hooks/useProposalAssets";
import carousel1 from "@/assets/carousel-1.jpg";
import carousel2 from "@/assets/carousel-2.jpg";
import carousel3 from "@/assets/carousel-3.jpg";

// Fallback projects using local assets if portfolio from Supabase is empty
const fallbackProjects = [
  {
    id: "fb-1",
    file_url: carousel1,
    project_name: "Residencia contemporanea",
    project_category: "Residencial",
  },
  {
    id: "fb-2",
    file_url: carousel2,
    project_name: "Clinica de saude integrativa",
    project_category: "Comercial",
  },
  {
    id: "fb-3",
    file_url: carousel3,
    project_name: "Banheiro assinado",
    project_category: "Interiores",
  },
];

export function PortfolioSection() {
  const { portfolio } = useProposalAssets();
  const activePortfolio = portfolio?.filter((p) => p.is_active !== false) || [];
  const projects = activePortfolio.length > 0 ? activePortfolio.slice(0, 3) : fallbackProjects;

  return (
    <section id="projetos" className="relative py-24 md:py-32 bg-[#F5E0D0]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 md:mb-20 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
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
              NOSSO TRABALHO
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                color: "#1B2A4A",
                fontWeight: 300,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              Projetos <em style={{ color: "#C4756E", fontStyle: "italic" }}>selecionados</em>
            </h2>
          </motion.div>
          <motion.a
            href="https://instagram.com/quadraarq"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="group inline-flex items-center gap-2 text-[#1B2A4A] text-sm transition-colors hover:text-[#8B4557]"
            style={{
              fontFamily: "'Jost', sans-serif",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontWeight: 400,
            }}
          >
            <Instagram className="h-4 w-4" strokeWidth={1.5} />
            Ver mais no Instagram
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </motion.a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {projects.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: (i % 3) * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden aspect-[4/5] bg-[#1B2A4A]/10">
                <img
                  src={p.file_url}
                  alt={p.project_name || "Projeto"}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                {/* Overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 40%, rgba(27,42,74,0.85) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2 text-[#F0DCC8]">
                    <span
                      className="text-xs uppercase"
                      style={{ letterSpacing: "3px", fontFamily: "'Jost', sans-serif" }}
                    >
                      Ver projeto
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="pt-5">
                {p.project_category && (
                  <p
                    className="text-xs mb-2"
                    style={{
                      color: "#8B4557",
                      letterSpacing: "3px",
                      fontFamily: "'Jost', sans-serif",
                      textTransform: "uppercase",
                      fontWeight: 500,
                    }}
                  >
                    {p.project_category}
                  </p>
                )}
                <h3
                  className="transition-colors group-hover:text-[#8B4557]"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.375rem",
                    color: "#1B2A4A",
                    fontWeight: 400,
                    lineHeight: 1.3,
                  }}
                >
                  {p.project_name || "Projeto"}
                </h3>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
