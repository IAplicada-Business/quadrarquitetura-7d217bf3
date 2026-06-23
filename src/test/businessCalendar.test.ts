import { describe, it, expect } from "vitest";
import {
  isBusinessDay,
  addBusinessDays,
  buildTimeline,
  holidaysForYear,
} from "@/lib/businessCalendar";

const d = (iso: string) => new Date(iso + "T00:00:00Z");

describe("businessCalendar", () => {
  describe("holidaysForYear", () => {
    it("inclui feriados fixos nacionais", () => {
      const h = holidaysForYear(2026);
      expect(h.has("2026-01-01")).toBe(true);
      expect(h.has("2026-04-21")).toBe(true);
      expect(h.has("2026-09-07")).toBe(true);
      expect(h.has("2026-12-25")).toBe(true);
    });
    it("calcula Sexta-feira Santa e Corpus Christi corretamente em 2026", () => {
      // Páscoa 2026: 5 de abril. Sexta Santa: 3/4. Corpus Christi: 4/6.
      const h = holidaysForYear(2026);
      expect(h.has("2026-04-03")).toBe(true);
      expect(h.has("2026-06-04")).toBe(true);
    });
    it("aceita feriados extras municipais", () => {
      const h = holidaysForYear(2026, ["2026-08-15"]);
      expect(h.has("2026-08-15")).toBe(true);
    });
  });

  describe("isBusinessDay", () => {
    it("descarta fim de semana", () => {
      expect(isBusinessDay(d("2026-06-13"))).toBe(false); // sábado
      expect(isBusinessDay(d("2026-06-14"))).toBe(false); // domingo
      expect(isBusinessDay(d("2026-06-15"))).toBe(true); // segunda
    });
    it("descarta feriado nacional", () => {
      expect(isBusinessDay(d("2026-09-07"))).toBe(false);
    });
    it("descarta recesso de fim de ano", () => {
      expect(isBusinessDay(d("2026-12-22"))).toBe(false);
      expect(isBusinessDay(d("2027-01-03"))).toBe(false);
    });
  });

  describe("addBusinessDays", () => {
    it("pula fim de semana", () => {
      // sexta 12/jun + 1 dia útil = segunda 15/jun
      const r = addBusinessDays(d("2026-06-12"), 1);
      expect(r.toISOString().slice(0, 10)).toBe("2026-06-15");
    });
    it("pula feriado nacional", () => {
      // 04/set (sex) + 2 dias úteis pula 07/set (segunda, feriado)
      const r = addBusinessDays(d("2026-09-04"), 2);
      expect(r.toISOString().slice(0, 10)).toBe("2026-09-09");
    });
  });

  describe("buildTimeline", () => {
    it("encadeia etapas dependentes", () => {
      const schedule = buildTimeline(
        [
          { id: "a", name: "Demolição", duration_days: 3 },
          { id: "b", name: "Alvenaria", duration_days: 5, depends_on: ["a"] },
        ],
        "2026-06-15", // segunda
      );
      const a = schedule.find((s) => s.id === "a")!;
      const b = schedule.find((s) => s.id === "b")!;
      expect(a.start_date).toBe("2026-06-15");
      expect(a.end_date).toBe("2026-06-17"); // 3 dias úteis: seg, ter, qua
      expect(b.start_date).toBe("2026-06-18"); // próximo dia útil
    });

    it("permite paralelismo quando não há dependência", () => {
      const schedule = buildTimeline(
        [
          { id: "a", name: "Elétrica", duration_days: 5 },
          { id: "b", name: "Hidráulica", duration_days: 5 },
        ],
        "2026-06-15",
      );
      const a = schedule.find((s) => s.id === "a")!;
      const b = schedule.find((s) => s.id === "b")!;
      expect(a.start_date).toBe(b.start_date);
    });

    it("não trava em ciclo", () => {
      const schedule = buildTimeline(
        [
          { id: "a", name: "A", duration_days: 1, depends_on: ["b"] },
          { id: "b", name: "B", duration_days: 1, depends_on: ["a"] },
        ],
        "2026-06-15",
      );
      // Não deve travar — ambas saem com data válida.
      expect(schedule).toHaveLength(2);
    });
  });
});
