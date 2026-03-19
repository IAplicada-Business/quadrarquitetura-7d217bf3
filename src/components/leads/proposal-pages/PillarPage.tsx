import { PageContainer, COLORS, LogoSmall, DecorativeShape, type ProposalPageProps } from "./shared";
import { Clock, DollarSign, ShoppingBag, BadgeCheck, CalendarCheck, MapPin, type LucideIcon } from "lucide-react";

const DEFAULT_PILLAR_TEXTS: Record<string, string> = {
  pilar_planejamento: `• Estudamos todo o projeto feito (tanto 3D quanto executivo)
• Reunimos com projetista responsável
• Realizamos formulário inicial de alinhamento de obra com o cliente
• Definimos o escopo da obra
• Definimos as sequências de execução
• Emitimos documento de responsabilidade
• Entramos em contato com o síndico, condomínio
• Estudamos as regras do condomínio para execução de obras`,
  pilar_orcamento: `• Alinhamos os fornecedores compatíveis com preço/qualidade esperada
• Orçamos absolutamente todos os itens necessários para execução do projeto
• Provisionamos valores de imprevistos e estimativas de materiais internos (ex: tubulação, fiação)
• Cobramos retorno de orçamentos
• Comparamos e corrigimos o orçamento
• Montamos uma tabela de acompanhamento de obra pro cliente
• Realizamos uma reunião de prioridades para mostrar os cenários e definirmos as previsões financeiras`,
  pilar_aquisicao: `• Disponibilizamos a lista de compras online
• Ajustamos as datas de compra para chegada combinar com logística da obra
• Conferimos todos os orçamentos, links e itens a serem comprados
• Nos disponibilizamos para recebimento de materiais comprados online
• Ajudamos na gestão de pagamentos (enviamos lembretes com antecedência)
• Disponibilizamos uma conta numerário da Quadra para simplificar pagamentos de pequenos materiais`,
  pilar_qualidade: `• Acompanhamento constante em obra
• Visitas guiadas com o cliente para alinhamentos rápidos e acompanhamento de execução
• Presença constante e alinhamentos em todas as medições para evitar retrabalho
• Medições constantes para evitar quebradeiras
• Revisões de projetos necessárias (com o aval da projetista)`,
  pilar_execucao: `• Execução e revisão de cronograma durante a obra
• Inclusão de ordem de atividades
• Medições e liberações para pagamento
• Conferência das NBR's
• Conferência das normas de segurança de trabalho
• Conferência constante de projeto
• Contato constante com projetista`,
  pilar_pessoas: `• Orientação de mão de obra
• Comunicação clara, simples e concisa para facilitar a execução
• Feedbacks e sugestões para melhor execução
• Gestão de retirada de lixo
• Gestão de isolamento de piso
• Gestão de limpeza durante a obra`,
};

const PILLAR_CONFIG: Record<string, { icon: LucideIcon; title: string; textKey: string }> = {
  planejamento: { icon: Clock, title: "PLANEJAMENTO", textKey: "pilar_planejamento" },
  orcamento: { icon: DollarSign, title: "ORÇAMENTO", textKey: "pilar_orcamento" },
  aquisicao: { icon: ShoppingBag, title: "AQUISIÇÃO DE MATERIAL", textKey: "pilar_aquisicao" },
  qualidade: { icon: BadgeCheck, title: "VERIFICAÇÃO DE QUALIDADE", textKey: "pilar_qualidade" },
  execucao: { icon: CalendarCheck, title: "ACOMPANHAMENTO DA EXECUÇÃO", textKey: "pilar_execucao" },
  pessoas: { icon: MapPin, title: "GESTÃO DE PESSOAS", textKey: "pilar_pessoas" },
};

interface PillarPageProps extends ProposalPageProps {
  pillarKey: string;
}

export function ProposalPillarPage({ pillarKey, pillarTexts, logoUrl }: PillarPageProps) {
  const config = PILLAR_CONFIG[pillarKey];
  if (!config) return null;

  const Icon = config.icon;
  const text = pillarTexts?.[config.textKey] || DEFAULT_PILLAR_TEXTS[config.textKey] || "";
  const bullets = text.split("\n").filter(l => l.trim());

  return (
    <PageContainer bg={COLORS.roseMauve}>
      <div style={{ position: "absolute", top: 50, left: 60 }}>
        <Icon size={80} color={COLORS.textoClaro} strokeWidth={1} style={{ opacity: 0.7 }} />
      </div>

      <div style={{ padding: "60px 60px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ color: COLORS.textoClaro, fontSize: 26, fontWeight: 700, textTransform: "uppercase", lineHeight: 1.2, marginBottom: 32, paddingTop: 60 }}>
          {config.title}
        </h2>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
          {bullets.map((bullet, i) => (
            <p key={i} style={{ color: COLORS.textoClaro, fontSize: 14, lineHeight: 1.8, marginBottom: 4 }}>
              {bullet.startsWith("•") ? bullet : `• ${bullet}`}
            </p>
          ))}
        </div>
      </div>

      <DecorativeShape position="br" />
      <LogoSmall url={logoUrl} position="bl" />
    </PageContainer>
  );
}

export const PILLAR_KEYS = Object.keys(PILLAR_CONFIG);
