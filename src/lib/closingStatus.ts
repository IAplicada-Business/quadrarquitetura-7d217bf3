// Status do cronograma de fechamento do cliente (client_closing_schedule).
// Compartilhado entre a subaba Fechamento Cliente e a Contagem Regressiva.
import type { ClosingScheduleItem } from "@/hooks/useClientClosingSchedule";

export type ClosingStatus = ClosingScheduleItem["status"];

export const CLOSING_STATUS_LABEL: Record<ClosingStatus, string> = {
  em_cotacao: "Em cotação",
  aprovado: "Aprovado",
  comprado: "Comprado",
  entregue: "Entregue",
};

export const CLOSING_STATUS_CLASS: Record<ClosingStatus, string> = {
  em_cotacao: "bg-yellow-100 text-yellow-800 border-yellow-300",
  aprovado: "bg-primary/10 text-primary border-primary/30",
  comprado: "bg-blue-100 text-blue-800 border-blue-300",
  entregue: "bg-success/15 text-success border-success/30",
};
