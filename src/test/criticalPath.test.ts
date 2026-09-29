import { describe, it, expect } from "vitest";
import { computeCriticalPath } from "@/lib/criticalPath";

describe("computeCriticalPath", () => {
  it("sem atividades elegíveis devolve vazio", () => {
    const r = computeCriticalPath([{ id: "a", start_date: null, duration: 5 }, { id: "b", start_date: "2026-01-05", duration: 0 }]);
    expect(r.criticalCount).toBe(0);
    expect(r.estimatedEndDate).toBeNull();
  });

  it("cadeia com ramo paralelo: o ramo mais curto tem folga", () => {
    const r = computeCriticalPath([
      { id: "A", start_date: "2026-01-05", duration: 5 },
      { id: "B", start_date: "2026-01-05", duration: 3, dependencies: ["A"] },
      { id: "C", start_date: "2026-01-05", duration: 5, dependencies: ["A"] },
    ]);
    expect(r.criticalIds.has("A")).toBe(true);
    expect(r.criticalIds.has("C")).toBe(true);
    expect(r.criticalIds.has("B")).toBe(false);
    expect(r.floatMap.get("B")).toBe(2);
    expect(r.totalCriticalDays).toBe(10);
    expect(r.criticalCount).toBe(2);
    expect(r.totalWithDeps).toBe(3);
  });

  it("dependência para atividade fora do conjunto é ignorada", () => {
    const r = computeCriticalPath([
      { id: "A", start_date: "2026-01-05", duration: 2, dependencies: ["fantasma"] },
    ]);
    expect(r.criticalIds.has("A")).toBe(true);
  });
});
