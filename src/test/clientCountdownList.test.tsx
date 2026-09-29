import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClientCountdownList } from "@/components/projects/ClientCountdownList";
import type { ProjectActivity } from "@/hooks/useProjectActivities";
import type { ClosingScheduleItem } from "@/hooks/useClientClosingSchedule";

const HOJE = new Date("2026-09-29T00:00:00");

function act(partial: Partial<ProjectActivity> & { id: string; name: string }): ProjectActivity {
  return {
    project_id: "p1", user_id: "u1", description: null, area_m2: null, duration_days: null,
    start_date: null, end_date: null, medicao_date: null, status: "pendente", progress_percent: 0,
    depends_on: [], discipline: null, position: 0, created_at: "2026-09-01T00:00:00Z", ...partial,
  };
}

function closing(partial: Partial<ClosingScheduleItem> & { id: string; description: string }): ClosingScheduleItem {
  return {
    project_id: "p1", user_id: "u1", delivery_date: null, closing_date: null, delivery_time: null,
    estimated_value: null, status: "em_cotacao", display_order: 0, created_at: "2026-09-01T00:00:00Z", ...partial,
  };
}

describe("Contagem Regressiva (antiga Lista Cliente)", () => {
  it("junta atividades do reverso e entregas do cliente, do fim para o começo, com a MUDANÇA como marco", () => {
    const demolicao = act({ id: "a1", name: "Demolição", start_date: "2026-09-21", end_date: "2026-10-02", duration_days: 10 });
    const pintura = act({ id: "a3", name: "Pintura", start_date: "2026-10-05", end_date: "2026-10-09", duration_days: 5 });
    const semData = act({ id: "a9", name: "Sem data" });
    const marcenaria = closing({ id: "c1", description: "Marcenaria — cozinha", closing_date: "2026-09-15", delivery_date: "2026-10-20", status: "comprado", estimated_value: 12000 });

    render(
      <ClientCountdownList activities={[demolicao, pintura, semData]} closingItems={[marcenaria]} moveInDate="2026-10-15" today={HOJE} />,
    );

    expect(screen.getByTestId("move-in-banner")).toHaveTextContent("Faltam 16 dias para a mudança");

    const ordem = screen
      .getAllByTestId(/^countdown-/)
      .map((r) => r.getAttribute("data-testid"));
    expect(ordem).toEqual(["countdown-closing-c1", "countdown-move-in", "countdown-activity-a3", "countdown-activity-a1"]);

    expect(screen.getByTestId("countdown-closing-c1")).toHaveTextContent("Comprado");
    expect(screen.getByTestId("countdown-closing-c1")).toHaveTextContent("R$ 12.000,00");
    expect(screen.getByTestId("countdown-activity-a1")).toHaveTextContent("10");
    expect(screen.queryByText("Sem data")).not.toBeInTheDocument();
  });

  it("mudança depois de tudo fica no topo", () => {
    const demolicao = act({ id: "a1", name: "Demolição", start_date: "2026-09-21", end_date: "2026-10-02", duration_days: 10 });
    render(<ClientCountdownList activities={[demolicao]} closingItems={[]} moveInDate="2026-12-01" today={HOJE} />);
    const ordem = screen.getAllByTestId(/^countdown-/).map((r) => r.getAttribute("data-testid"));
    expect(ordem).toEqual(["countdown-move-in", "countdown-activity-a1"]);
  });

  it("sem datas e sem mudança orienta a aplicar o calendário no Cronograma Reverso", () => {
    render(<ClientCountdownList activities={[act({ id: "a1", name: "Demolição" })]} closingItems={[]} moveInDate={null} today={HOJE} />);
    expect(screen.getByText(/Aplique o calendário no Cronograma Reverso/)).toBeInTheDocument();
    expect(screen.queryByTestId("move-in-banner")).not.toBeInTheDocument();
  });
});
