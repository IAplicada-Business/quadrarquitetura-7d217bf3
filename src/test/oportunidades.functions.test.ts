import { describe, expect, it } from "vitest";
import {
  aguardandoAprovacaoCliente,
  adminPodeAprovarPorAutorTeste,
  agruparPorStatus,
  isUsuarioTestePerfil,
  metricasOportunidadesDashboard,
  ordenarColunaOportunidades,
  proximaOrdemColuna,
  STATUS_ORDEM,
  STATUS_LABEL,
  PRIORIDADE_ORDEM,
  PRIORIDADE_LABEL,
  motivoRecusaValido,
  MOTIVO_RECUSA_MIN,
  podeVerComentario,
  solucaoValida,
  SOLUCAO_MIN,
  COMENTARIO_TIPO_ORDEM,
  COMENTARIO_TIPO_LABEL,
  type Oportunidade,
} from "@/lib/oportunidades.functions";

function stubOpt(partial: Partial<Oportunidade>): Oportunidade {
  return {
    id: partial.id ?? "1",
    numero: partial.numero ?? "OPT-0001",
    tipo: partial.tipo ?? "melhoria",
    titulo: partial.titulo ?? "Titulo",
    descricao: partial.descricao ?? "",
    tela_origem: null,
    cliente_id: null,
    autor_id: null,
    impacto: partial.impacto ?? null,
    frequencia_uso: null,
    problema_resolve: null,
    prioridade: partial.prioridade ?? "media",
    status: partial.status ?? "backlog",
    cerebro_conversa_id: null,
    aprovado_autor_em: partial.aprovado_autor_em ?? null,
    aprovado_autor_id: null,
    data_prevista: partial.data_prevista ?? null,
    criado_em: partial.criado_em ?? "2026-06-01T12:00:00Z",
    atualizado_em: partial.atualizado_em ?? "2026-08-01T12:00:00Z",
  };
}

describe("aguardandoAprovacaoCliente", () => {
  it("true quando entregue sem aprovação", () => {
    expect(aguardandoAprovacaoCliente({ status: "entregue", aprovado_autor_em: null })).toBe(true);
  });

  it("false quando entregue e já aprovado", () => {
    expect(
      aguardandoAprovacaoCliente({ status: "entregue", aprovado_autor_em: "2026-07-28T12:00:00Z" }),
    ).toBe(false);
  });

  it("false fora da coluna entregue", () => {
    expect(aguardandoAprovacaoCliente({ status: "em_dev", aprovado_autor_em: null })).toBe(false);
  });
});

describe("isUsuarioTestePerfil / adminPodeAprovarPorAutorTeste", () => {
  it("reconhece Usuário Teste por nome e e-mail sandbox", () => {
    expect(isUsuarioTestePerfil({ nome: "Usuário Teste" })).toBe(true);
    expect(isUsuarioTestePerfil({ email: "email@exemplo.com" })).toBe(true);
    expect(isUsuarioTestePerfil({ nome: "Cibele Rabelo", email: "cibele@lcr.com" })).toBe(false);
  });

  it("admin aprova entrega de qualquer autor (call LCR 12/08)", () => {
    expect(adminPodeAprovarPorAutorTeste({ ehAdmin: true, autorNome: "Usuário Teste" })).toBe(true);
    expect(adminPodeAprovarPorAutorTeste({ ehAdmin: true, autorNome: "Bruno Souza" })).toBe(true);
    expect(adminPodeAprovarPorAutorTeste({ ehAdmin: false, autorNome: "Usuário Teste" })).toBe(
      false,
    );
  });
});

describe("STATUS_ORDEM", () => {
  it("inclui backlog como primeira coluna", () => {
    expect(STATUS_ORDEM[0]).toBe("backlog");
    expect(STATUS_ORDEM).toHaveLength(6);
  });

  // A etapa saiu em 17/08 por duplicar o Backlog. O rótulo fica (histórico
  // antigo mostra "Aberto"), mas a coluna não pode voltar ao Kanban.
  it("não tem mais a etapa Aberto", () => {
    expect(STATUS_ORDEM).not.toContain("aberto");
    expect(STATUS_LABEL.aberto).toBe("Aberto");
  });

  it("card legado em aberto cai no Backlog", () => {
    const map = agruparPorStatus([{ status: "aberto" } as Oportunidade]);
    expect(map.backlog).toHaveLength(1);
  });

  it("tem label para cada status", () => {
    for (const s of STATUS_ORDEM) {
      expect(STATUS_LABEL[s]).toBeTruthy();
    }
  });
});

describe("PRIORIDADE_ORDEM", () => {
  it("tem quatro níveis com labels", () => {
    expect(PRIORIDADE_ORDEM).toEqual(["critica", "alta", "media", "baixa"]);
    for (const p of PRIORIDADE_ORDEM) {
      expect(PRIORIDADE_LABEL[p]).toBeTruthy();
    }
  });
});

describe("agruparPorStatus", () => {
  it("coloca status backlog sem quebrar", () => {
    const map = agruparPorStatus([{ status: "backlog" } as Oportunidade]);
    expect(map.backlog).toHaveLength(1);
  });

  it("status desconhecido vai para backlog", () => {
    const map = agruparPorStatus([
      { status: "invalido" as Oportunidade["status"] } as Oportunidade,
    ]);
    expect(map.backlog).toHaveLength(1);
  });
});

describe("metricasOportunidadesDashboard", () => {
  it("conta entregas, bugs e próximas por prioridade", () => {
    const agora = new Date("2026-08-04T12:00:00Z");
    const m = metricasOportunidadesDashboard(
      [
        stubOpt({
          id: "a",
          tipo: "bug",
          status: "entregue",
          aprovado_autor_em: "2026-08-02T10:00:00Z",
          atualizado_em: "2026-08-02T10:00:00Z",
        }),
        stubOpt({
          id: "b",
          tipo: "bug",
          status: "entregue",
          aprovado_autor_em: null,
          atualizado_em: "2026-08-03T10:00:00Z",
        }),
        stubOpt({
          id: "c",
          tipo: "bug",
          status: "backlog",
          impacto: "bloqueia",
          prioridade: "alta",
        }),
        stubOpt({
          id: "d",
          tipo: "melhoria",
          status: "em_dev",
          prioridade: "critica",
          titulo: "Primeiro",
        }),
        stubOpt({
          id: "e",
          tipo: "melhoria",
          status: "planejado",
          prioridade: "baixa",
        }),
      ],
      agora,
    );
    expect(m.entregues).toBe(2);
    expect(m.aguardandoAprovacao).toBe(1);
    expect(m.bugsEntregues).toBe(2);
    expect(m.bugsAbertos).toBe(1);
    expect(m.bugsBloqueantesAbertos).toBe(1);
    expect(m.emAndamento).toBe(1);
    expect(m.proximas[0]?.titulo).toBe("Primeiro");
    const ago = m.serieEntregas.find((x) => x.key === "2026-08");
    expect(ago?.entregues).toBe(2);
    expect(ago?.bugs).toBe(2);
  });
});

describe("ordenarColunaOportunidades", () => {
  const itens = [
    stubOpt({
      id: "1",
      prioridade: "baixa",
      criado_em: "2026-01-01T10:00:00Z",
      titulo: "Antigo baixa",
    }),
    stubOpt({
      id: "2",
      prioridade: "critica",
      criado_em: "2026-03-01T10:00:00Z",
      titulo: "Novo critica",
    }),
    stubOpt({
      id: "3",
      prioridade: "alta",
      criado_em: "2026-02-01T10:00:00Z",
      titulo: "Meio alta",
    }),
  ];

  it("por prioridade coloca crítica antes de baixa", () => {
    const out = ordenarColunaOportunidades(itens, "prioridade");
    expect(out.map((o) => o.id)).toEqual(["2", "3", "1"]);
  });

  it("registro_asc = ordem de registro (FIFO)", () => {
    const out = ordenarColunaOportunidades(itens, "registro_asc");
    expect(out.map((o) => o.id)).toEqual(["1", "3", "2"]);
  });

  it("registro_desc = mais recentes primeiro", () => {
    const out = ordenarColunaOportunidades(itens, "registro_desc");
    expect(out.map((o) => o.id)).toEqual(["2", "3", "1"]);
  });

  it("proximaOrdemColuna cicla os três modos", () => {
    expect(proximaOrdemColuna("prioridade")).toBe("registro_asc");
    expect(proximaOrdemColuna("registro_asc")).toBe("registro_desc");
    expect(proximaOrdemColuna("registro_desc")).toBe("prioridade");
  });
});

// Tarefa 07 — a recusa exige motivo. A mesma regra vive na RPC
// recusar_entrega_oportunidade; este teste trava o lado do cliente para os dois
// não divergirem em silêncio. Recusa sem motivo é exatamente o problema que a
// tarefa resolve: seis pessoas escreveram "reprovado" num comentário e o card
// seguiu contando como entregue.
describe("motivoRecusaValido", () => {
  it("recusa vazio, espaço em branco e nulo", () => {
    expect(motivoRecusaValido("")).toBe(false);
    expect(motivoRecusaValido("        ")).toBe(false);
    expect(motivoRecusaValido(null)).toBe(false);
    expect(motivoRecusaValido(undefined)).toBe(false);
  });

  it("recusa texto curto demais — 'reprovado' sozinho não passa", () => {
    expect(motivoRecusaValido("reprovado")).toBe(false);
    expect(motivoRecusaValido("nao")).toBe(false);
  });

  it("aceita a partir do mínimo, ignorando espaço nas pontas", () => {
    expect(motivoRecusaValido("a".repeat(MOTIVO_RECUSA_MIN))).toBe(true);
    expect(motivoRecusaValido(`   ${"a".repeat(MOTIVO_RECUSA_MIN)}   `)).toBe(true);
    expect(motivoRecusaValido("a".repeat(MOTIVO_RECUSA_MIN - 1))).toBe(false);
  });

  it("aceita um motivo real", () => {
    expect(motivoRecusaValido("continua sem trazer a conta do banco no mês 2")).toBe(true);
  });
});

// Visibilidade dos comentários. Espelha a policy p_oport_com_select (migration
// 20260817120000): sem o tipo público não havia como responder quem reportou o
// card, e o "interno" do rótulo era lido por qualquer autenticado.
describe("podeVerComentario", () => {
  const ctxOutroUsuario = { ehAdmin: false, userId: "u-2" };

  it("público é lido por qualquer um", () => {
    expect(podeVerComentario({ tipo: "publico", autor_id: "u-1" }, ctxOutroUsuario)).toBe(true);
    expect(
      podeVerComentario({ tipo: "publico", autor_id: "u-1" }, { ehAdmin: false, userId: null }),
    ).toBe(true);
  });

  it("interno não vaza para quem reportou o card", () => {
    expect(podeVerComentario({ tipo: "interno", autor_id: "u-1" }, ctxOutroUsuario)).toBe(false);
    expect(
      podeVerComentario({ tipo: "interno", autor_id: "u-1" }, { ehAdmin: false, userId: null }),
    ).toBe(false);
  });

  it("interno continua visível para admin e para quem escreveu a nota", () => {
    expect(
      podeVerComentario({ tipo: "interno", autor_id: "u-1" }, { ehAdmin: true, userId: "u-2" }),
    ).toBe(true);
    expect(
      podeVerComentario({ tipo: "interno", autor_id: "u-2" }, { ehAdmin: false, userId: "u-2" }),
    ).toBe(true);
  });

  it("nota interna sem autor só aparece para admin", () => {
    expect(podeVerComentario({ tipo: "interno", autor_id: null }, ctxOutroUsuario)).toBe(false);
    expect(
      podeVerComentario({ tipo: "interno", autor_id: null }, { ehAdmin: true, userId: "u-2" }),
    ).toBe(true);
  });
});

describe("solucaoValida / seletor de tipo", () => {
  it("exige texto — concluir sem resposta é o que deixava o autor no escuro", () => {
    expect(solucaoValida("")).toBe(false);
    expect(solucaoValida("   ")).toBe(false);
    expect(solucaoValida(null)).toBe(false);
    expect(solucaoValida("ok")).toBe(false);
  });

  it("aceita a partir do mínimo, ignorando espaço nas pontas", () => {
    expect(solucaoValida("a".repeat(SOLUCAO_MIN))).toBe(true);
    expect(solucaoValida(`  ${"a".repeat(SOLUCAO_MIN)}  `)).toBe(true);
    expect(solucaoValida("a".repeat(SOLUCAO_MIN - 1))).toBe(false);
  });

  it("público é a primeira opção do seletor e todo tipo tem rótulo", () => {
    expect(COMENTARIO_TIPO_ORDEM[0]).toBe("publico");
    for (const t of COMENTARIO_TIPO_ORDEM) {
      expect(COMENTARIO_TIPO_LABEL[t]).toBeTruthy();
    }
  });
});
