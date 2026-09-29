import { describe, it, expect } from "vitest";
import {
  countBusinessDays,
  endDateFromBusinessDays,
  nextBusinessDay,
  computeReverseMetrics,
  businessDaysUntil,
  applyReverseEdit,
  todayIso,
} from "@/lib/reverseSchedule";

// Referências de 2026: 07/09 (segunda) é feriado; 29/09 é terça.
const HOJE = "2026-09-29";

describe("countBusinessDays", () => {
  it("conta ambos os extremos e pula fim de semana", () => {
    expect(countBusinessDays("2026-09-21", "2026-09-25")).toBe(5); // seg..sex
    expect(countBusinessDays("2026-09-21", "2026-09-27")).toBe(5); // inclui sáb/dom
    expect(countBusinessDays("2026-09-26", "2026-09-27")).toBe(0); // só fim de semana
  });

  it("exclui feriado nacional (Independência, 07/09/2026)", () => {
    expect(countBusinessDays("2026-09-01", "2026-09-11")).toBe(8);
    expect(countBusinessDays("2026-09-07", "2026-09-07")).toBe(0);
  });

  it("exclui o recesso de fim de ano", () => {
    expect(countBusinessDays("2026-12-21", "2027-01-05")).toBe(0);
    expect(countBusinessDays("2026-12-18", "2027-01-06")).toBe(2); // 18/12 (sex) e 06/01 (qua)
  });

  it("devolve 0 quando o término é antes do início ou falta data", () => {
    expect(countBusinessDays("2026-09-25", "2026-09-21")).toBe(0);
    expect(countBusinessDays("", "2026-09-21")).toBe(0);
  });
});

describe("endDateFromBusinessDays / nextBusinessDay", () => {
  it("5 dias úteis a partir de sexta 04/09 terminam em 11/09 (pula fim de semana e feriado)", () => {
    expect(endDateFromBusinessDays("2026-09-04", 5)).toBe("2026-09-11");
    expect(countBusinessDays("2026-09-04", "2026-09-11")).toBe(5);
  });

  it("prazo de 1 dia termina no próprio dia útil", () => {
    expect(endDateFromBusinessDays("2026-09-22", 1)).toBe("2026-09-22");
    expect(endDateFromBusinessDays("2026-09-26", 1)).toBe("2026-09-28"); // sábado -> segunda
  });

  it("nextBusinessDay avança feriado e fim de semana", () => {
    expect(nextBusinessDay("2026-09-05")).toBe("2026-09-08"); // sáb, dom, feriado
    expect(nextBusinessDay("2026-09-22")).toBe("2026-09-22");
  });
});

describe("computeReverseMetrics", () => {
  it("atividade em andamento: trabalhados + faltantes = prazo", () => {
    const m = computeReverseMetrics({ start_date: "2026-09-21", end_date: "2026-10-02", status: "em_andamento" }, HOJE);
    expect(m.totalDays).toBe(10);
    expect(m.workedDays).toBe(7); // 21..25 e 28,29
    expect(m.remainingDays).toBe(3);
    expect(m.isOverdue).toBe(false);
    expect(m.hasStarted).toBe(true);
    expect(m.overdueDays).toBe(0);
  });

  it("atividade atrasada: faltantes 0 e atraso em dias úteis", () => {
    const m = computeReverseMetrics({ start_date: "2026-09-21", end_date: "2026-09-25", status: "pendente" }, HOJE);
    expect(m.totalDays).toBe(5);
    expect(m.workedDays).toBe(5);
    expect(m.remainingDays).toBe(0);
    expect(m.isOverdue).toBe(true);
    expect(m.overdueDays).toBe(2); // 28 e 29
  });

  it("atividade concluída nunca fica atrasada", () => {
    const m = computeReverseMetrics({ start_date: "2026-09-21", end_date: "2026-09-25", status: "concluida" }, HOJE);
    expect(m.isFinished).toBe(true);
    expect(m.isOverdue).toBe(false);
    expect(m.workedDays).toBe(5);
    expect(m.remainingDays).toBe(0);
  });

  it("atividade futura: nada trabalhado e conta dias úteis até começar", () => {
    const m = computeReverseMetrics({ start_date: "2026-10-05", end_date: "2026-10-09", status: "pendente" }, HOJE);
    expect(m.hasStarted).toBe(false);
    expect(m.workedDays).toBe(0);
    expect(m.remainingDays).toBe(5);
    expect(m.daysToStart).toBe(4); // 30/09, 01, 02, 05/10
  });

  it("sem datas devolve nulos", () => {
    const m = computeReverseMetrics({ start_date: null, end_date: null }, HOJE);
    expect(m.totalDays).toBeNull();
    expect(m.remainingDays).toBeNull();
    expect(m.isOverdue).toBe(false);
  });

  it("só com início trata o término como o mesmo dia", () => {
    const m = computeReverseMetrics({ start_date: "2026-09-29", end_date: null }, HOJE);
    expect(m.totalDays).toBe(1);
    expect(m.workedDays).toBe(1);
    expect(m.remainingDays).toBe(0);
  });
});

describe("businessDaysUntil", () => {
  it("positivo no futuro, negativo no passado, zero hoje", () => {
    expect(businessDaysUntil("2026-10-02", HOJE)).toBe(3);
    expect(businessDaysUntil("2026-09-25", HOJE)).toBe(-2);
    expect(businessDaysUntil(HOJE, HOJE)).toBe(0);
  });
});

describe("applyReverseEdit (fórmulas da planilha)", () => {
  const atual = { start_date: "2026-09-21", end_date: "2026-10-02" };

  it("editar o início mantém o término e recalcula o prazo", () => {
    expect(applyReverseEdit(atual, "start_date", "2026-09-23")).toEqual({
      start_date: "2026-09-23",
      end_date: "2026-10-02",
      duration_days: 8,
    });
  });

  it("início depois do término arrasta o término junto", () => {
    expect(applyReverseEdit(atual, "start_date", "2026-10-06")).toEqual({
      start_date: "2026-10-06",
      end_date: "2026-10-06",
      duration_days: 1,
    });
  });

  it("editar o término mantém o início; término antes do início arrasta o início", () => {
    expect(applyReverseEdit(atual, "end_date", "2026-10-09")).toMatchObject({ start_date: "2026-09-21", end_date: "2026-10-09", duration_days: 15 });
    expect(applyReverseEdit(atual, "end_date", "2026-09-15")).toEqual({ start_date: "2026-09-15", end_date: "2026-09-15", duration_days: 1 });
  });

  it("editar o prazo em dias úteis recalcula o término a partir do início", () => {
    expect(applyReverseEdit({ start_date: "2026-09-04", end_date: "2026-09-04" }, "duration_days", 5)).toEqual({
      start_date: "2026-09-04",
      end_date: "2026-09-11",
      duration_days: 5,
    });
    expect(applyReverseEdit(atual, "duration_days", "3")).toMatchObject({ end_date: "2026-09-23", duration_days: 3 });
  });

  it("sem início, o prazo parte de hoje", () => {
    const r = applyReverseEdit({ start_date: null, end_date: null }, "duration_days", 2)!;
    expect(r.start_date).toBe(todayIso());
    expect(r.duration_days).toBe(2);
  });

  it("rejeita valores inválidos", () => {
    expect(applyReverseEdit(atual, "duration_days", 0)).toBeNull();
    expect(applyReverseEdit(atual, "duration_days", "abc")).toBeNull();
    expect(applyReverseEdit(atual, "start_date", "29/09/2026")).toBeNull();
  });
});
