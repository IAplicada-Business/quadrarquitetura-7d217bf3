import { describe, it, expect } from "vitest";
import {
  getPrerequisitePreview,
  resolvePrerequisiteDiscipline,
  isMedicaoAnchored,
} from "@/lib/prerequisiteTasks";

describe("resolvePrerequisiteDiscipline", () => {
  it("reconhece a disciplina exata", () => {
    expect(resolvePrerequisiteDiscipline({ name: "Armários", discipline: "Marcenaria" })).toBe("Marcenaria");
    expect(resolvePrerequisiteDiscipline({ name: "Bancadas", discipline: "Marmoraria" })).toBe("Marmoraria");
  });

  it("ignora caixa, acento e espaços — bug relatado na Marcenaria", () => {
    expect(resolvePrerequisiteDiscipline({ name: "x", discipline: "marcenaria" })).toBe("Marcenaria");
    expect(resolvePrerequisiteDiscipline({ name: "x", discipline: " MARCENARIA " })).toBe("Marcenaria");
    expect(resolvePrerequisiteDiscipline({ name: "x", discipline: "Iluminacao" })).toBe("Iluminação");
  });

  it("aceita complementos e apelidos no campo livre", () => {
    expect(resolvePrerequisiteDiscipline({ name: "x", discipline: "Marcenaria sob medida" })).toBe("Marcenaria");
    expect(resolvePrerequisiteDiscipline({ name: "x", discipline: "Marcenaria/Serralheria" })).toBe("Marcenaria");
    expect(resolvePrerequisiteDiscipline({ name: "x", discipline: "Móveis planejados" })).toBe("Marcenaria");
    expect(resolvePrerequisiteDiscipline({ name: "x", discipline: "Vidraçaria" })).toBe("Vidros");
  });

  it("cai para o nome da atividade quando a disciplina não diz nada", () => {
    expect(resolvePrerequisiteDiscipline({ name: "Marcenaria — 1º Pavimento", discipline: null })).toBe("Marcenaria");
    expect(resolvePrerequisiteDiscipline({ name: "Marcenaria da cozinha", discipline: "Acabamentos diversos" })).toBe("Marcenaria");
  });

  it("não usa o nome quando a disciplina é uma sem cadeia", () => {
    expect(resolvePrerequisiteDiscipline({ name: "Demolição de piso", discipline: "Demolição" })).toBeNull();
    expect(resolvePrerequisiteDiscipline({ name: "Pintura do armário", discipline: "Pintura" })).toBeNull();
  });

  it("não casa palavra parcial", () => {
    expect(resolvePrerequisiteDiscipline({ name: "Compra de EPIs", discipline: "Segurança" })).toBeNull();
  });
});

describe("getPrerequisitePreview", () => {
  it("gera a cadeia de Marcenaria mesmo com a disciplina em variação", () => {
    const preview = getPrerequisitePreview({
      name: "Armários da cozinha",
      discipline: "marcenaria sob medida",
      start_date: "2026-06-01",
    });
    expect(preview).toHaveLength(5);
    expect(preview[0].title).toBe("Medir em obra — Armários da cozinha");
    expect(preview[0].due_date).toBe("2026-04-17"); // -45 dias
    expect(preview[4].due_date).toBe("2026-06-01");
  });

  it("re-ancora a cadeia pela data de medição", () => {
    const preview = getPrerequisitePreview({
      name: "Bancada",
      discipline: "Marmoraria",
      start_date: "2026-06-01",
      medicao_date: "2026-05-10",
    });
    expect(preview[0].due_date).toBe("2026-05-10");
    expect(preview[1].due_date).toBe("2026-05-12"); // -18 relativo a -20
    expect(preview[2].due_date).toBe("2026-05-30"); // 0 relativo a -20
  });

  it("devolve vazio para disciplina sem cadeia", () => {
    expect(getPrerequisitePreview({ name: "Reboco", discipline: "Alvenaria" })).toHaveLength(0);
  });
});

describe("isMedicaoAnchored", () => {
  it("aceita variações da disciplina", () => {
    expect(isMedicaoAnchored("marcenaria")).toBe(true);
    expect(isMedicaoAnchored("Marcenaria sob medida")).toBe(true);
    expect(isMedicaoAnchored("Vidraçaria")).toBe(true);
    expect(isMedicaoAnchored("Pintura")).toBe(false);
    expect(isMedicaoAnchored(null)).toBe(false);
  });
});
