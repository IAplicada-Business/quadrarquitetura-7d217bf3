import { describe, it, expect } from "vitest";
import {
  BLOCK_DEFAULTS,
  PROPOSAL_BLOCK_KEYS,
  PROPOSAL_BLOCK_DEFINITIONS,
  blockContent,
  resolveProposalBlocks,
  defaultProposalBlocks,
  moveProposalBlock,
  toProposalBlockUpserts,
  proposalBlocksEqual,
  pickProposalLogos,
  flowStepsFromBlocks,
  FLOW_STEP_TIMELINE,
  type ProposalBlockRow,
} from "@/lib/proposalBlocks";
import { renderRichText, stripRichText } from "@/components/leads/proposal-pages/RichText";

function row(partial: Partial<ProposalBlockRow> & { key: string }): ProposalBlockRow {
  return {
    id: `id-${partial.key}`,
    team_id: "team-1",
    user_id: "u1",
    label: "",
    display_order: 0,
    is_active: true,
    content_json: {},
    created_at: "2026-09-29T00:00:00Z",
    updated_at: "2026-09-29T00:00:00Z",
    ...partial,
  };
}

describe("definições dos blocos", () => {
  it("cobre as 9 páginas do PDF, na ordem original", () => {
    expect(PROPOSAL_BLOCK_KEYS).toEqual([
      "cover", "about", "scope", "interiores", "management", "whyhire", "portfolio", "values", "contact",
    ]);
    expect(PROPOSAL_BLOCK_DEFINITIONS.map((d) => d.key)).toEqual(PROPOSAL_BLOCK_KEYS);
  });

  it("todo campo editável existe no conteúdo padrão", () => {
    for (const def of PROPOSAL_BLOCK_DEFINITIONS) {
      const defaults = BLOCK_DEFAULTS[def.key] as unknown as Record<string, unknown>;
      for (const f of def.fields) {
        expect(defaults, `${def.key}.${f.key}`).toHaveProperty(f.key);
        if (f.kind === "cards") expect(Array.isArray(defaults[f.key])).toBe(true);
        else expect(typeof defaults[f.key]).toBe("string");
      }
    }
  });
});

describe("blockContent", () => {
  it("sem nada salvo devolve o padrão completo", () => {
    expect(blockContent("about")).toEqual(BLOCK_DEFAULTS.about);
    expect(blockContent("about", null)).toEqual(BLOCK_DEFAULTS.about);
  });

  it("mescla o que foi salvo com o padrão", () => {
    const c = blockContent("about", { title: "Sobre a Quadra" });
    expect(c.title).toBe("Sobre a Quadra");
    expect(c.body).toBe(BLOCK_DEFAULTS.about.body);
    expect(c.founders).toHaveLength(2);
  });

  it("ignora chaves desconhecidas e tipos errados", () => {
    const c = blockContent("values", { title: 42, hacker: "x", consultLabel: "Sob consulta" });
    expect(c.title).toBe(BLOCK_DEFAULTS.values.title);
    expect((c as unknown as Record<string, unknown>).hacker).toBeUndefined();
    expect(c.consultLabel).toBe("Sob consulta");
  });

  it("filtra cards inválidos e mantém os válidos (inclusive lista vazia = serviço retirado)", () => {
    const c = blockContent("management", {
      cards: [{ title: "Planejamento", items: ["a", "b"] }, { nope: true }, { title: 1 }],
    });
    expect(c.cards).toEqual([{ title: "Planejamento", items: ["a", "b"] }]);
    expect(blockContent("management", { cards: [] }).cards).toEqual([]);
  });

  it("não compartilha referência com o padrão", () => {
    const c = blockContent("whyhire");
    c.cards.push({ title: "extra" });
    expect(BLOCK_DEFAULTS.whyhire.cards).toHaveLength(4);
  });
});

describe("resolveProposalBlocks", () => {
  it("tabela vazia => 9 blocos ativos na ordem padrão", () => {
    const blocks = resolveProposalBlocks([]);
    expect(blocks.map((b) => b.key)).toEqual(PROPOSAL_BLOCK_KEYS);
    expect(blocks.every((b) => b.is_active && b.isDefault)).toBe(true);
    expect(blocks.map((b) => b.display_order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(defaultProposalBlocks()).toEqual(blocks);
  });

  it("respeita ordem e toggle salvos e completa com os blocos que faltam", () => {
    const blocks = resolveProposalBlocks([
      row({ key: "values", display_order: 0 }),
      row({ key: "cover", display_order: 1 }),
      row({ key: "interiores", display_order: 2, is_active: false }),
    ]);
    expect(blocks.map((b) => b.key)).toEqual([
      "values", "cover", "interiores", "about", "scope", "management", "whyhire", "portfolio", "contact",
    ]);
    expect(blocks.find((b) => b.key === "interiores")!.is_active).toBe(false);
    expect(blocks.find((b) => b.key === "interiores")!.isDefault).toBe(false);
    expect(blocks.find((b) => b.key === "about")!.isDefault).toBe(true);
  });

  it("ignora chaves desconhecidas e linhas duplicadas", () => {
    const blocks = resolveProposalBlocks([
      row({ key: "legacy_page", display_order: 0 }),
      row({ key: "about", display_order: 1, content_json: { title: "A" } }),
      row({ id: "dup", key: "about", display_order: 2, content_json: { title: "B" } }),
    ]);
    expect(blocks).toHaveLength(9);
    expect(blocks[0].key).toBe("about");
    expect((blocks[0].content as { title: string }).title).toBe("A");
  });

  it("usa o label salvo, ou o padrão quando vazio", () => {
    const blocks = resolveProposalBlocks([
      row({ key: "about", label: "Sobre nós" }),
      row({ key: "cover", label: "  ", display_order: 1 }),
    ]);
    expect(blocks[0].label).toBe("Sobre nós");
    expect(blocks[1].label).toBe("Capa");
  });
});

describe("moveProposalBlock", () => {
  it("reordena e renumera display_order", () => {
    const blocks = defaultProposalBlocks();
    const moved = moveProposalBlock(blocks, 8, 0);
    expect(moved[0].key).toBe("contact");
    expect(moved[1].key).toBe("cover");
    expect(moved.map((b) => b.display_order)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(blocks[0].key).toBe("cover"); // original intacto
  });

  it("índices inválidos devolvem a mesma lista", () => {
    const blocks = defaultProposalBlocks();
    expect(moveProposalBlock(blocks, 0, 0)).toBe(blocks);
    expect(moveProposalBlock(blocks, -1, 2)).toBe(blocks);
    expect(moveProposalBlock(blocks, 1, 99)).toBe(blocks);
  });
});

describe("toProposalBlockUpserts / proposalBlocksEqual", () => {
  it("gera uma linha por bloco com a ordem da lista", () => {
    const blocks = moveProposalBlock(defaultProposalBlocks(), 1, 0);
    const rows = toProposalBlockUpserts(blocks);
    expect(rows[0]).toMatchObject({ key: "about", display_order: 0, is_active: true, label: "Quem Somos" });
    expect(rows[1]).toMatchObject({ key: "cover", display_order: 1 });
    expect(rows[0].content_json).toEqual(BLOCK_DEFAULTS.about);
    expect(rows.map((r) => r.key)).toHaveLength(9);
  });

  it("detecta diferença de ordem, toggle e conteúdo", () => {
    const a = defaultProposalBlocks();
    expect(proposalBlocksEqual(a, defaultProposalBlocks())).toBe(true);
    expect(proposalBlocksEqual(a, moveProposalBlock(a, 0, 1))).toBe(false);
    const toggled = a.map((b) => (b.key === "interiores" ? { ...b, is_active: false } : b));
    expect(proposalBlocksEqual(a, toggled)).toBe(false);
    const edited = a.map((b) => (b.key === "about" ? { ...b, content: { ...b.content, title: "X" } } : b));
    expect(proposalBlocksEqual(a, edited)).toBe(false);
  });
});

describe("rich text simples", () => {
  it("renderiza negrito, itálico e quebras de linha sem HTML bruto", () => {
    const nodes = renderRichText("Olá **mundo** e *tudo*\nnova linha <b>x</b>");
    const strongs = nodes.filter((n) => typeof n === "object" && n !== null && (n as { type?: string }).type === "strong");
    const ems = nodes.filter((n) => typeof n === "object" && n !== null && (n as { type?: string }).type === "em");
    const brs = nodes.filter((n) => typeof n === "object" && n !== null && (n as { type?: string }).type === "br");
    expect(strongs).toHaveLength(1);
    expect(ems).toHaveLength(1);
    expect(brs).toHaveLength(1);
    // Tags digitadas continuam texto puro.
    expect(nodes.some((n) => typeof n === "string" && n.includes("<b>x</b>"))).toBe(true);
  });

  it("texto sem marcação vira um único nó de texto", () => {
    expect(renderRichText("simples")).toEqual(["simples"]);
    expect(renderRichText("")).toEqual([]);
  });

  it("stripRichText remove os marcadores", () => {
    expect(stripRichText("**a** *b* c")).toBe("a b c");
  });
});


describe("etapas do fluxo editáveis", () => {
  it("padrão tem as 7 etapas originais com key ligada ao prazo da proposta", () => {
    const steps = flowStepsFromBlocks(defaultProposalBlocks());
    expect(steps).toHaveLength(7);
    expect(steps.map((s) => s.key)).toEqual(Object.keys(FLOW_STEP_TIMELINE));
  });

  it("mantém key e meta ao sanitizar e descarta tipos errados", () => {
    const c = blockContent("scope", {
      steps: [
        { key: "Briefing", title: "Briefing", desc: "x" },
        { key: "etapa-abc", title: "Vistoria final", desc: "y", meta: "2 dias" },
        { key: 5, title: "inválida" },
      ],
    });
    expect(c.steps).toEqual([
      { key: "Briefing", title: "Briefing", desc: "x" },
      { key: "etapa-abc", title: "Vistoria final", desc: "y", meta: "2 dias" },
    ]);
  });

  it("flowStepsFromBlocks lê o bloco salvo (etapas removidas somem do formulário)", () => {
    const blocks = defaultProposalBlocks().map((b) =>
      b.key === "scope" ? { ...b, content: { ...b.content, steps: [{ key: "Briefing", title: "Briefing" }, { key: "etapa-1", title: "Nova", meta: "3 dias" }] } } : b,
    );
    expect(flowStepsFromBlocks(blocks as ReturnType<typeof defaultProposalBlocks>).map((s) => s.key)).toEqual(["Briefing", "etapa-1"]);
  });
});

describe("pickProposalLogos", () => {
  it("separa por variante do metadata, depois pelo nome; um logo só vale para os dois fundos", () => {
    expect(pickProposalLogos([])).toEqual({ onDark: undefined, onLight: undefined });
    expect(pickProposalLogos([{ file_url: "u.png", name: "Logo Quadra" }])).toEqual({ onDark: "u.png", onLight: "u.png" });
    expect(
      pickProposalLogos([
        { file_url: "claro.png", name: "Logo claro", metadata: { variant: "light" } },
        { file_url: "escuro.png", name: "Logo escuro", metadata: { variant: "dark" } },
      ]),
    ).toEqual({ onDark: "claro.png", onLight: "escuro.png" });
    expect(pickProposalLogos([{ file_url: "b.png", name: "logo-branco" }, { file_url: "a.png", name: "logo-azul" }])).toEqual({ onDark: "b.png", onLight: "a.png" });
  });
});
