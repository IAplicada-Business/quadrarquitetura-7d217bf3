import { describe, expect, it } from "vitest";
import { sanitizeEmptyStrings } from "@/lib/sanitizePayload";

describe("sanitizeEmptyStrings", () => {
  it("converts empty strings to null (date-safe)", () => {
    expect(
      sanitizeEmptyStrings({
        name: "Lead",
        meeting_date: "",
        notes: "",
        phone: "31999999999",
      }),
    ).toEqual({
      name: "Lead",
      meeting_date: null,
      notes: null,
      phone: "31999999999",
    });
  });

  it("preserves null, numbers and non-empty strings", () => {
    expect(
      sanitizeEmptyStrings({
        start_date: null,
        progress: 0,
        status: "pendente",
      }),
    ).toEqual({
      start_date: null,
      progress: 0,
      status: "pendente",
    });
  });
});
