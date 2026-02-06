// Centralized project status configuration
// Status simplificados: 7 fases macro

export const PROJECT_STATUSES = [
  "proposta",
  "contrato",
  "projeto",
  "planejamento",
  "mobilizacao",
  "execucao",
  "concluido",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const statusLabels: Record<string, string> = {
  proposta: "Proposta",
  contrato: "Contrato",
  projeto: "Projeto",
  planejamento: "Planejamento",
  mobilizacao: "Mobilização",
  execucao: "Execução",
  concluido: "Concluído",
};

export const statusColors: Record<string, string> = {
  proposta: "bg-muted text-muted-foreground",
  contrato: "bg-primary/10 text-primary",
  projeto: "bg-accent/10 text-accent-foreground",
  planejamento: "bg-secondary text-secondary-foreground",
  mobilizacao: "bg-warning/10 text-warning",
  execucao: "bg-success/10 text-success",
  concluido: "bg-success/20 text-success",
};

export const statusEmojis: Record<string, string> = {
  proposta: "📋",
  contrato: "✍️",
  projeto: "📐",
  planejamento: "🧮",
  mobilizacao: "🏗️",
  execucao: "🔨",
  concluido: "✅",
};

// Sub-fases por fase macro (uso interno granular)
export const subStatusOptions: Record<string, string[]> = {
  projeto: [
    "Levantamento",
    "Briefing",
    "Estudo Preliminar",
    "Revisão",
    "Anteprojeto (3D)",
    "Projeto Executivo",
  ],
  planejamento: [
    "Memória de Cálculo",
    "Orçamento",
    "Reunião de Prioridades",
  ],
};
