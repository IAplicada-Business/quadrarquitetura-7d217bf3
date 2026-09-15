import { describe, expect, it } from "vitest";
import { deveMostrarReminder, type RemindState } from "@/lib/oportunidades-aprovacao-reminder";

function state(partial: Partial<RemindState>): RemindState {
  return {
    day: "2026-08-04",
    lastShownAt: "2026-08-04T12:00:00.000Z",
    snoozeUntil: null,
    ...partial,
  };
}

describe("deveMostrarReminder", () => {
  it("mostra quando não há estado salvo", () => {
    expect(deveMostrarReminder(new Date("2026-08-04T15:00:00.000Z"), null)).toBe(true);
  });

  it("mostra na primeira abertura de um novo dia (America/Sao_Paulo)", () => {
    const now = new Date("2026-08-05T04:00:00.000Z");
    expect(deveMostrarReminder(now, state({ day: "2026-08-04" }))).toBe(true);
  });

  it("não mostra de novo no mesmo dia antes de 1h", () => {
    const now = new Date("2026-08-04T12:30:00.000Z");
    expect(
      deveMostrarReminder(
        now,
        state({ day: "2026-08-04", lastShownAt: "2026-08-04T12:00:00.000Z" }),
      ),
    ).toBe(false);
  });

  it("mostra de novo após 1h no mesmo dia", () => {
    const now = new Date("2026-08-04T13:00:00.000Z");
    expect(
      deveMostrarReminder(
        now,
        state({ day: "2026-08-04", lastShownAt: "2026-08-04T12:00:00.000Z" }),
      ),
    ).toBe(true);
  });

  it("respeita snoozeUntil", () => {
    const before = new Date("2026-08-04T12:30:00.000Z");
    const after = new Date("2026-08-04T13:30:00.000Z");
    const s = state({
      day: "2026-08-04",
      lastShownAt: "2026-08-04T12:00:00.000Z",
      snoozeUntil: "2026-08-04T13:00:00.000Z",
    });
    expect(deveMostrarReminder(before, s)).toBe(false);
    expect(deveMostrarReminder(after, s)).toBe(true);
  });
});
