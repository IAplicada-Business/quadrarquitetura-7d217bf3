import { describe, it, expect } from "vitest";
import {
  tabFromHash,
  onboardingSeenKey,
  daysUntil,
  describeCountdown,
  computeProgress,
  currentPhase,
  extractPendings,
  groupPhotosByDate,
  formatWeekLabel,
  formatDateLong,
  type PortalTask,
  type PortalWeeklyReport,
  type PortalPendingResponse,
} from "@/lib/portal";

const HOJE = new Date(2026, 8, 29); // 29/09/2026

const task = (p: Partial<PortalTask> & { id: string }): PortalTask => ({
  task_name: p.id, start_date: null, end_date: null, status: "planejado", discipline: null, color: null, progress_percentage: null, ...p,
});
const report = (p: Partial<PortalWeeklyReport> & { id: string; week_start: string }): PortalWeeklyReport => ({
  summary: "s", next_steps: "n", completion_percent: 0, photo_urls: [], client_pending: null, created_at: "2026-01-01", ...p,
});

describe("navegação", () => {
  it("hash vira aba; desconhecido vira início", () => {
    expect(tabFromHash("#pendencias")).toBe("pendencias");
    expect(tabFromHash("#Galeria")).toBe("galeria");
    expect(tabFromHash("#nada")).toBe("inicio");
    expect(tabFromHash("")).toBe("inicio");
  });
  it("chave de boas-vindas é por token", () => {
    expect(onboardingSeenKey("abc")).not.toBe(onboardingSeenKey("xyz"));
  });
});

describe("datas", () => {
  it("contagem até a mudança", () => {
    expect(daysUntil("2026-10-09", HOJE)).toBe(10);
    expect(daysUntil("2026-09-29", HOJE)).toBe(0);
    expect(daysUntil("2026-09-27", HOJE)).toBe(-2);
    expect(daysUntil(null, HOJE)).toBeNull();
    expect(describeCountdown(10)).toBe("faltam 10 dias");
    expect(describeCountdown(1)).toBe("falta 1 dia".replace("falta", "faltam"));
    expect(describeCountdown(0)).toBe("é hoje");
    expect(describeCountdown(-2)).toBe("há 2 dias");
    expect(describeCountdown(null)).toBe("data a definir");
  });
  it("formata semana e data longa em português", () => {
    expect(formatWeekLabel("2026-08-10")).toBe("Semana de 10 a 16 de agosto");
    expect(formatWeekLabel("2026-08-31")).toBe("Semana de 31 de agosto a 06 de setembro");
    expect(formatDateLong("2026-09-09")).toBe("09 de setembro");
  });
});

describe("progresso e fase", () => {
  it("último relatório manda; sem relatório usa proporção do cronograma", () => {
    const reports = [report({ id: "r1", week_start: "2026-08-03", completion_percent: 40 }), report({ id: "r2", week_start: "2026-08-10", completion_percent: 64 })];
    expect(computeProgress(reports, [])).toBe(64);
    const tasks = [task({ id: "a", status: "executado" }), task({ id: "b", status: "executado" }), task({ id: "c", status: "planejado" }), task({ id: "d" })];
    expect(computeProgress([], tasks)).toBe(50);
    expect(computeProgress([], [])).toBeNull();
  });

  it("fase atual: em execução > a iniciar > concluído", () => {
    const tasks = [
      task({ id: "a", discipline: "Fundação", status: "executado", start_date: "2026-08-01", end_date: "2026-08-20" }),
      task({ id: "b", discipline: "Estrutura", status: "em_execucao", start_date: "2026-09-01", end_date: "2026-10-15" }),
      task({ id: "c", discipline: "Instalações", status: "planejado", start_date: "2026-10-16", end_date: "2026-11-10" }),
    ];
    expect(currentPhase(tasks, HOJE)).toMatchObject({ label: "Estrutura", state: "em_execucao" });
    expect(currentPhase(tasks.filter((t) => t.id !== "b"), HOJE)).toMatchObject({ label: "Instalações", state: "a_iniciar" });
    expect(currentPhase([tasks[0]], HOJE)).toMatchObject({ label: "Fundação", state: "concluido" });
    expect(currentPhase([], HOJE)).toBeNull();
  });

  it("tarefa planejada dentro do período conta como em execução", () => {
    const t = task({ id: "x", task_name: "Pintura", status: "planejado", start_date: "2026-09-20", end_date: "2026-10-05" });
    expect(currentPhase([t], HOJE)).toMatchObject({ label: "Pintura", state: "em_execucao" });
  });
});

describe("pendências e fotos", () => {
  it("abertas primeiro, mais recentes no topo; respondidas depois", () => {
    const reports = [
      report({ id: "r1", week_start: "2026-08-03", client_pending: "Aprovar marcenaria" }),
      report({ id: "r2", week_start: "2026-08-10", client_pending: "Escolher revestimento" }),
      report({ id: "r3", week_start: "2026-08-17", client_pending: null }),
    ];
    const responses: PortalPendingResponse[] = [
      { id: "p1", weekly_report_id: "r1", pending_item: "Aprovar marcenaria", response_text: null, status: "aprovado", responded_at: "2026-08-05", client_name: "Ana", created_at: "2026-08-05" },
    ];
    const list = extractPendings(reports, responses);
    expect(list.map((p) => [p.item, p.isOpen])).toEqual([
      ["Escolher revestimento", true],
      ["Aprovar marcenaria", false],
    ]);
    expect(list[1].response?.status).toBe("aprovado");
  });

  it("resposta 'aguardando' não fecha a pendência", () => {
    const reports = [report({ id: "r1", week_start: "2026-08-03", client_pending: "X" })];
    const responses: PortalPendingResponse[] = [{ id: "p", weekly_report_id: "r1", pending_item: "X", response_text: null, status: "aguardando", responded_at: null, client_name: null, created_at: "" }];
    expect(extractPendings(reports, responses)[0].isOpen).toBe(true);
  });

  it("agrupa fotos por data, mais recentes primeiro", () => {
    const groups = groupPhotosByDate([
      { url: "a", date: "2026-06-02" },
      { url: "b", date: "2026-06-28" },
      { url: "c", date: "2026-06-02" },
    ]);
    expect(groups.map((g) => g.date)).toEqual(["2026-06-28", "2026-06-02"]);
    expect(groups[1].urls).toEqual(["a", "c"]);
  });
});
