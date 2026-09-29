import { describe, it, expect } from "vitest";
import {
  parseVideoUrl,
  sanitizeSection,
  sectionsFromJson,
  sectionsFromRows,
  cloneSectionsForProject,
  moveSection,
  visibleSections,
  emptySection,
  starterSections,
  type OnboardingSectionRow,
} from "@/lib/onboarding";

describe("parseVideoUrl", () => {
  it("reconhece as formas de link do YouTube", () => {
    const esperado = "https://www.youtube.com/embed/dQw4w9WgXcQ";
    expect(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s")).toEqual({ kind: "youtube", src: esperado });
    expect(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({ kind: "youtube", src: esperado });
    expect(parseVideoUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toEqual({ kind: "youtube", src: esperado });
    expect(parseVideoUrl("https://m.youtube.com/embed/dQw4w9WgXcQ")).toEqual({ kind: "youtube", src: esperado });
  });

  it("reconhece Vimeo", () => {
    expect(parseVideoUrl("https://vimeo.com/123456789")).toEqual({ kind: "vimeo", src: "https://player.vimeo.com/video/123456789" });
    expect(parseVideoUrl("https://player.vimeo.com/video/123456789?h=abc")).toEqual({ kind: "vimeo", src: "https://player.vimeo.com/video/123456789" });
  });

  it("reconhece arquivo de vídeo (upload do bucket)", () => {
    const url = "https://x.supabase.co/storage/v1/object/public/onboarding-media/p1/videos/1.mp4";
    expect(parseVideoUrl(url)).toEqual({ kind: "file", src: url });
  });

  it("link desconhecido vira link externo; vazio ou inválido vira null", () => {
    expect(parseVideoUrl("https://drive.google.com/file/d/abc/view")?.kind).toBe("unknown");
    expect(parseVideoUrl("")).toBeNull();
    expect(parseVideoUrl("nao é url")).toBeNull();
    expect(parseVideoUrl(null)).toBeNull();
  });
});

describe("sanitizeSection / sectionsFromJson", () => {
  it("preenche defaults e descarta lixo", () => {
    const s = sanitizeSection({ id: "s1", title: "Oi", image_urls: ["a.jpg", 3, ""], cta_label: "  " });
    expect(s).toEqual({
      id: "s1",
      title: "Oi",
      body: "",
      video_url: null,
      image_urls: ["a.jpg"],
      cta_label: null,
      cta_url: null,
      is_active: true,
      source_section_id: null,
    });
    expect(sanitizeSection({ title: "sem id" })).toBeNull();
    expect(sanitizeSection("x")).toBeNull();
  });

  it("sectionsFromJson ignora itens inválidos e não-arrays", () => {
    expect(sectionsFromJson([{ id: "a", title: "A" }, null, { title: "B" }])).toHaveLength(1);
    expect(sectionsFromJson({ id: "a" })).toEqual([]);
  });
});

describe("sectionsFromRows", () => {
  it("ordena por display_order e mapeia as colunas", () => {
    const row = (id: string, order: number): OnboardingSectionRow => ({
      id, team_id: "t", user_id: "u", template_id: "tpl", title: id, body: "b", video_url: null, image_urls: null,
      cta_label: null, cta_url: null, display_order: order, is_active: true, created_at: "2026-01-01", updated_at: "2026-01-01",
    });
    const list = sectionsFromRows([row("b", 1), row("a", 0)]);
    expect(list.map((s) => s.id)).toEqual(["a", "b"]);
    expect(list[0].image_urls).toEqual([]);
  });
});

describe("cloneSectionsForProject", () => {
  it("gera ids novos e guarda a origem, sem compartilhar arrays", () => {
    const tpl = [emptySection({ id: "t1", title: "A", image_urls: ["x.jpg"] }), emptySection({ id: "t2", title: "B" })];
    const clone = cloneSectionsForProject(tpl);
    expect(clone).toHaveLength(2);
    expect(clone[0].id).not.toBe("t1");
    expect(clone[0].source_section_id).toBe("t1");
    expect(clone[1].source_section_id).toBe("t2");
    clone[0].image_urls.push("y.jpg");
    expect(tpl[0].image_urls).toEqual(["x.jpg"]);
  });

  it("clonar uma cópia mantém a origem original", () => {
    const tpl = [emptySection({ id: "t1" })];
    const again = cloneSectionsForProject(cloneSectionsForProject(tpl));
    expect(again[0].source_section_id).toBe("t1");
  });
});

describe("moveSection / visibleSections / starterSections", () => {
  it("move e mantém o original", () => {
    const list = [emptySection({ id: "a" }), emptySection({ id: "b" }), emptySection({ id: "c" })];
    expect(moveSection(list, 2, 0).map((s) => s.id)).toEqual(["c", "a", "b"]);
    expect(list.map((s) => s.id)).toEqual(["a", "b", "c"]);
    expect(moveSection(list, 0, 9)).toBe(list);
  });

  it("cliente só vê seções ativas com algum conteúdo", () => {
    const list = [
      emptySection({ id: "a", title: "Tem título" }),
      emptySection({ id: "b", title: "Desligada", is_active: false }),
      emptySection({ id: "c" }),
      emptySection({ id: "d", video_url: "https://youtu.be/x" }),
    ];
    expect(visibleSections(list).map((s) => s.id)).toEqual(["a", "d"]);
  });

  it("sugestão inicial tem 3 seções com ids únicos", () => {
    const s = starterSections();
    expect(s).toHaveLength(3);
    expect(new Set(s.map((x) => x.id)).size).toBe(3);
  });
});
