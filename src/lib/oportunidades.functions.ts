// Queries/mutations do Banco de Oportunidades (Buddy · Bug) — /buddy/bug.
import { supabase } from "@/integrations/supabase/client";

export type OportTipo = "bug" | "melhoria" | "duvida";
export type OportStatus =
  | "backlog"
  | "aberto"
  | "em_analise"
  | "planejado"
  | "em_dev"
  | "entregue"
  | "descartado";
export type OportImpacto = "bloqueia" | "atrapalha" | "cosmetico";
export type OportPrioridade = "critica" | "alta" | "media" | "baixa";

export type Oportunidade = {
  id: string;
  numero: string;
  tipo: OportTipo;
  titulo: string;
  descricao: string;
  tela_origem: string | null;
  cliente_id: string | null;
  autor_id: string | null;
  autor_nome?: string | null;
  impacto: OportImpacto | null;
  frequencia_uso: string | null;
  problema_resolve: string | null;
  prioridade: OportPrioridade;
  status: OportStatus;
  cerebro_conversa_id: string | null;
  aprovado_autor_em: string | null;
  aprovado_autor_id: string | null;
  /** Data prevista de solução (AAAA-MM-DD). Só admin edita — o cliente pediu
   *  para conseguir se planejar. Ver tarefa 09 da execução de 13/08. */
  data_prevista: string | null;
  criado_em: string;
  atualizado_em: string;
  votos?: number;
  votei?: boolean;
};

/**
 * Público = resposta que quem reportou o card lê (a solução, o andamento).
 * Interno = nota da equipe; o autor do card não vê.
 */
export type OportComentarioTipo = "interno" | "publico";

export type OportunidadeComentario = {
  id: string;
  oportunidade_id: string;
  autor_id: string | null;
  autor_nome?: string | null;
  tipo: OportComentarioTipo;
  conteudo: string;
  criado_em: string;
};

export type OportunidadeAnexo = {
  id: string;
  oportunidade_id: string;
  comentario_id: string | null;
  autor_id: string | null;
  autor_nome?: string | null;
  storage_path: string;
  nome_arquivo: string;
  content_type: string | null;
  tamanho_bytes: number | null;
  criado_em: string;
};

export type OportunidadeHistorico = {
  id: string;
  oportunidade_id: string;
  status_anterior: string | null;
  status_novo: string;
  mudado_por: string | null;
  mudado_por_nome?: string | null;
  mudado_em: string;
  comentario: string | null;
};

/** Entregue sem aprovação do criador = aguardando validação do reportador. */
export function aguardandoAprovacaoCliente(
  o: Pick<Oportunidade, "status" | "aprovado_autor_em">,
): boolean {
  return o.status === "entregue" && !o.aprovado_autor_em;
}

/**
 * Autor de teste (sandbox / QA). Cards criados por esses usuários podem ser
 * aprovados por admin — o "Usuário Teste" não valida entrega no fluxo real.
 */
export function isUsuarioTestePerfil(p: { nome?: string | null; email?: string | null }): boolean {
  const nome = (p.nome ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const email = (p.email ?? "").toLowerCase();
  if (nome.includes("usuario teste") || nome.includes("user teste") || nome.includes("user test")) {
    return true;
  }
  if (!email) return false;
  if (email === "email@exemplo.com") return true;
  if (email.endsWith("@exemplo.com") || email.endsWith("@example.com")) return true;
  if (email.includes("+teste@") || email.startsWith("teste@")) return true;
  return false;
}

/**
 * Admin pode aprovar entrega de qualquer card — quem administra acompanha e
 * destrava pedidos do time quando o autor não responde. Mantém helper antigo
 * como alias.
 */
export function adminPodeAprovarEntrega(opts: { ehAdmin: boolean }): boolean {
  return opts.ehAdmin;
}

/** @deprecated Preferir adminPodeAprovarEntrega — admin agora aprova qualquer autor. */
export function adminPodeAprovarPorAutorTeste(opts: {
  ehAdmin: boolean;
  autorNome?: string | null;
  autorEmail?: string | null;
}): boolean {
  return adminPodeAprovarEntrega({ ehAdmin: opts.ehAdmin });
}

/**
 * [ADAPTADO — Quadra] No sistema de origem os nomes vinham de
 * `usuarios_perfil.nome`; aqui a tabela de perfis é `profiles`
 * (user_id, full_name). Só a origem do nome muda.
 *
 * Nome é enfeite: se a consulta falhar (RLS não deixa ler o perfil dos
 * outros, por exemplo), o card continua aparecendo sem o nome em vez de
 * derrubar a listagem inteira.
 */
async function mapNomesUsuarios(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter(Boolean))] as string[];
  if (!unicos.length) return new Map();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", unicos);
  if (error) return new Map();
  return new Map(
    (data ?? [])
      .filter((p): p is { user_id: string; full_name: string } => !!p.full_name)
      .map((p) => [p.user_id, p.full_name]),
  );
}

export async function listarOportunidades(): Promise<Oportunidade[]> {
  const [{ data: opts, error: e1 }, { data: votos, error: e2 }, { data: sess }] = await Promise.all(
    [
      supabase.from("oportunidades").select("*").order("criado_em", { ascending: false }),
      supabase.from("oportunidade_votos").select("oportunidade_id, user_id"),
      supabase.auth.getSession(),
    ],
  );
  if (e1) throw e1;
  if (e2) throw e2;
  const nomes = await mapNomesUsuarios((opts ?? []).map((o) => o.autor_id));
  const meuId = sess.session?.user?.id ?? null;
  const contagem = new Map<string, number>();
  const meusVotos = new Set<string>();
  for (const v of votos ?? []) {
    contagem.set(v.oportunidade_id, (contagem.get(v.oportunidade_id) ?? 0) + 1);
    if (v.user_id === meuId) meusVotos.add(v.oportunidade_id);
  }
  return (opts ?? []).map((o) => ({
    ...(o as Oportunidade),
    autor_nome: o.autor_id ? (nomes.get(o.autor_id) ?? null) : null,
    votos: contagem.get(o.id) ?? 0,
    votei: meusVotos.has(o.id),
  }));
}

export async function criarOportunidade(input: {
  tipo: OportTipo;
  titulo: string;
  descricao: string;
  tela_origem?: string | null;
  cliente_id?: string | null;
  impacto?: OportImpacto | null;
  frequencia_uso?: string | null;
  problema_resolve?: string | null;
  prioridade?: OportPrioridade;
  cerebro_conversa_id?: string | null;
}): Promise<Oportunidade> {
  const { data: sess } = await supabase.auth.getSession();
  const autorId = sess.session?.user?.id;
  if (!autorId) throw new Error("Sem sessão.");
  const { data, error } = await supabase
    .from("oportunidades")
    .insert({
      autor_id: autorId,
      numero: "", // trigger preenche
      tipo: input.tipo,
      titulo: input.titulo,
      descricao: input.descricao,
      tela_origem: input.tela_origem ?? null,
      cliente_id: input.cliente_id ?? null,
      impacto: input.impacto ?? null,
      frequencia_uso: input.frequencia_uso ?? null,
      problema_resolve: input.problema_resolve ?? null,
      prioridade: input.prioridade ?? "media",
      cerebro_conversa_id: input.cerebro_conversa_id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Oportunidade;
}

/** Aceitos no anexo do Banco de Oportunidades — só print/imagem, por ora. */
export const ANEXO_TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const ANEXO_TAMANHO_MAX = 8 * 1024 * 1024; // 8MB — cobre print de tela sem incomodar upload
export const ANEXO_MAX_POR_ENVIO = 4;

export function anexoValido(file: File): string | null {
  if (!ANEXO_TIPOS_ACEITOS.includes(file.type))
    return "Envie apenas imagens (PNG, JPG, WEBP, GIF).";
  if (file.size > ANEXO_TAMANHO_MAX) return "Imagem maior que 8MB — reduza antes de anexar.";
  return null;
}

/**
 * Sobe um print para o card (ou para um comentário específico, se
 * `comentarioId` vier preenchido). Bucket privado — print pode trazer tela
 * real de cliente — então o path carrega o id da oportunidade para dar pra
 * auditar/limpar por card se precisar.
 */
export async function anexarOportunidade(
  oportunidadeId: string,
  file: File,
  comentarioId?: string | null,
): Promise<OportunidadeAnexo> {
  const invalido = anexoValido(file);
  if (invalido) throw new Error(invalido);
  const { data: sess } = await supabase.auth.getSession();
  const autorId = sess.session?.user?.id;
  if (!autorId) throw new Error("Sem sessão.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${oportunidadeId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("oportunidade-anexos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("oportunidade_anexos")
    .insert({
      oportunidade_id: oportunidadeId,
      comentario_id: comentarioId ?? null,
      autor_id: autorId,
      storage_path: path,
      nome_arquivo: file.name,
      content_type: file.type,
      tamanho_bytes: file.size,
    })
    .select("*")
    .single();
  if (error) {
    // Não deixa órfão no bucket se a linha falhar (ex.: RLS de um comentário
    // que não é seu) — senão some da UI mas continua ocupando storage.
    await supabase.storage.from("oportunidade-anexos").remove([path]);
    throw error;
  }
  return data as OportunidadeAnexo;
}

/** Anexos do card + dos comentários visíveis para quem está olhando (a
 *  policy já filtra por comentário interno/público — aqui só busca e nomeia). */
export async function anexosOportunidade(id: string): Promise<OportunidadeAnexo[]> {
  const { data, error } = await supabase
    .from("oportunidade_anexos")
    .select("*")
    .eq("oportunidade_id", id)
    .order("criado_em");
  if (error) throw error;
  const nomes = await mapNomesUsuarios((data ?? []).map((a) => a.autor_id));
  return (data ?? []).map((a) => ({
    ...(a as OportunidadeAnexo),
    autor_nome: a.autor_id ? (nomes.get(a.autor_id) ?? null) : null,
  }));
}

/** URL assinada (60s) para exibir/baixar o print — bucket é privado. */
export async function urlAnexoOportunidade(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("oportunidade-anexos")
    .createSignedUrl(storagePath, 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function excluirAnexoOportunidade(
  anexo: Pick<OportunidadeAnexo, "id" | "storage_path">,
): Promise<void> {
  const { error } = await supabase.from("oportunidade_anexos").delete().eq("id", anexo.id);
  if (error) throw error;
  await supabase.storage.from("oportunidade-anexos").remove([anexo.storage_path]);
}

export async function mudarPrioridadeOportunidade(
  id: string,
  prioridade: OportPrioridade,
): Promise<void> {
  const { data, error } = await supabase
    .from("oportunidades")
    .update({ prioridade })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new Error("Só é possível alterar a prioridade dos seus próprios cards (ou como admin).");
}

export async function editarOportunidade(
  id: string,
  input: {
    tipo: OportTipo;
    titulo: string;
    descricao: string;
    impacto?: OportImpacto | null;
    prioridade?: OportPrioridade;
  },
): Promise<Oportunidade> {
  const patch = {
    tipo: input.tipo,
    titulo: input.titulo,
    descricao: input.descricao,
    impacto: input.impacto ?? null,
    ...(input.prioridade ? { prioridade: input.prioridade } : {}),
  };
  const { data, error } = await supabase
    .from("oportunidades")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Só é possível editar os seus próprios cards (ou como admin).");
  return data as Oportunidade;
}

export async function excluirOportunidade(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("oportunidades")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Só é possível excluir os seus próprios cards (ou como admin).");
}

export async function mudarStatusOportunidade(id: string, novo: OportStatus): Promise<void> {
  const { data, error } = await supabase
    .from("oportunidades")
    .update({ status: novo })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data)
    throw new Error(
      "Não foi possível atualizar o status. Apenas administradores podem mover cards no Kanban.",
    );
}

/** Cards do autor em Entregue aguardando a aprovação dele. */
export async function listarPendentesAprovacaoAutor(): Promise<
  Pick<
    Oportunidade,
    "id" | "numero" | "titulo" | "tipo" | "status" | "aprovado_autor_em" | "atualizado_em"
  >[]
> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("oportunidades")
    .select("id, numero, titulo, tipo, status, aprovado_autor_em, atualizado_em")
    .eq("autor_id", userId)
    .eq("status", "entregue")
    .is("aprovado_autor_em", null)
    .order("atualizado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pick<
    Oportunidade,
    "id" | "numero" | "titulo" | "tipo" | "status" | "aprovado_autor_em" | "atualizado_em"
  >[];
}

/** Criador ou admin aprova entrega (coluna Entregue). */
export async function aprovarEntregaOportunidade(id: string): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) throw new Error("Sem sessão.");
  const { data: opt, error: e1 } = await supabase
    .from("oportunidades")
    .select("autor_id, status, aprovado_autor_em")
    .eq("id", id)
    .single();
  if (e1) throw e1;
  if (opt.status !== "entregue") throw new Error("Só é possível aprovar cards na coluna Entregue.");
  if (opt.aprovado_autor_em) throw new Error("Esta entrega já foi aprovada.");

  const souCriador = opt.autor_id === userId;
  if (!souCriador) {
    // [ADAPTADO — Quadra] Papel vem de user_roles (enum app_role), o mesmo
    // lugar que o resto do sistema e o is_admin() do banco consultam.
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const ehAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!adminPodeAprovarEntrega({ ehAdmin })) {
      throw new Error("Apenas o criador do card ou um admin pode aprovar a entrega.");
    }
  }

  const agora = new Date().toISOString();
  const { error } = await supabase
    .from("oportunidades")
    .update({ aprovado_autor_em: agora, aprovado_autor_id: userId })
    .eq("id", id);
  if (error) throw error;
}

export async function votarOportunidade(id: string, votar: boolean): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user?.id;
  if (!userId) throw new Error("Sem sessão.");
  if (votar) {
    // insert puro: evita upsert (que exige UPDATE). Re-voto do mesmo user é no-op via PK.
    const { error } = await supabase
      .from("oportunidade_votos")
      .insert({ oportunidade_id: id, user_id: userId });
    if (error) {
      // 23505 = unique_violation — já votou; trata como sucesso.
      if ((error as { code?: string }).code === "23505") return;
      throw error;
    }
  } else {
    const { error } = await supabase
      .from("oportunidade_votos")
      .delete()
      .eq("oportunidade_id", id)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

export async function comentariosOportunidade(id: string): Promise<OportunidadeComentario[]> {
  const { data, error } = await supabase
    .from("oportunidade_comentarios")
    .select("*")
    .eq("oportunidade_id", id)
    .order("criado_em");
  if (error) throw error;
  const nomes = await mapNomesUsuarios((data ?? []).map((c) => c.autor_id));
  return (data ?? []).map((c) => ({
    ...(c as OportunidadeComentario),
    autor_nome: c.autor_id ? (nomes.get(c.autor_id) ?? null) : null,
  }));
}

export const COMENTARIO_TIPO_ORDEM: OportComentarioTipo[] = ["publico", "interno"];

export const COMENTARIO_TIPO_LABEL: Record<OportComentarioTipo, string> = {
  publico: "Visível para quem reportou",
  interno: "Interno (só a equipe)",
};

/** Etiqueta curta do comentário na listagem. */
export const COMENTARIO_TIPO_BADGE: Record<OportComentarioTipo, string> = {
  publico: "Resposta",
  interno: "Interno",
};

/**
 * Quem enxerga um comentário.
 *
 * Espelha a policy `p_oport_com_select` (migration 20260817120000) — o banco é
 * quem garante; aqui é para a listagem não prometer privacidade que a policy
 * não dá (e vice-versa). Se um dos dois lados mudar, o outro precisa acompanhar.
 */
export function podeVerComentario(
  c: Pick<OportunidadeComentario, "tipo" | "autor_id">,
  ctx: { ehAdmin: boolean; userId: string | null },
): boolean {
  if (c.tipo === "publico") return true;
  return ctx.ehAdmin || (!!ctx.userId && c.autor_id === ctx.userId);
}

export async function comentarOportunidade(
  id: string,
  conteudo: string,
  tipo: OportComentarioTipo = "interno",
): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const autorId = sess.session?.user?.id;
  if (!autorId) throw new Error("Sem sessão.");
  const { error } = await supabase.from("oportunidade_comentarios").insert({
    oportunidade_id: id,
    autor_id: autorId,
    tipo,
    conteudo,
  });
  if (error) throw error;
}

/** Texto mínimo da solução ao concluir — mesma régua do motivo de recusa. */
export const SOLUCAO_MIN = 10;

/** Solução aceitável para concluir o card (o autor vai ler isso). */
export function solucaoValida(texto: string | null | undefined): boolean {
  return (texto ?? "").trim().length >= SOLUCAO_MIN;
}

/**
 * Conclui o card: move para Entregue e responde quem reportou.
 *
 * A resposta vai como comentário público justamente porque o comentário interno
 * não chega a quem abriu o card — sem isso o autor recebe um "Entregue" e um
 * pedido de aprovação sem saber o que foi feito.
 *
 * O status vai primeiro por ser a ação com guarda (só admin); se o comentário
 * falhar depois, o card já está entregue e o erro precisa dizer isso, senão o
 * usuário tenta de novo e conclui duas vezes.
 */
export async function concluirOportunidadeComSolucao(id: string, solucao: string): Promise<void> {
  const texto = (solucao ?? "").trim();
  if (!solucaoValida(texto)) {
    throw new Error(
      `Descreva a solução (mínimo ${SOLUCAO_MIN} caracteres) — é o que quem reportou vai ler.`,
    );
  }
  await mudarStatusOportunidade(id, "entregue");
  try {
    await comentarOportunidade(id, texto, "publico");
  } catch {
    throw new Error(
      "O card foi marcado como Entregue, mas a resposta não foi salva. Envie o comentário pelo painel.",
    );
  }
}

/** Motivo mínimo exigido na recusa — espelha a checagem da RPC (migration
 *  20260813230000). Validar aqui evita ida ao servidor só para levar erro. */
export const MOTIVO_RECUSA_MIN = 10;

/**
 * Motivo aceitável para recusar uma entrega.
 *
 * A mesma regra existe na RPC `recusar_entrega_oportunidade` — o banco é quem
 * garante; aqui é para não gastar ida ao servidor e para poder desabilitar o
 * botão. Se um dos dois lados mudar, o outro precisa acompanhar: relaxar só
 * aqui deixa o usuário tomar erro do servidor sem entender por quê, e apertar
 * só aqui esconde do usuário uma recusa que o banco aceitaria.
 */
export function motivoRecusaValido(motivo: string | null | undefined): boolean {
  return (motivo ?? "").trim().length >= MOTIVO_RECUSA_MIN;
}

/**
 * Tarefa 07 — autor ou admin recusa a entrega.
 *
 * Move o card de Entregue para Em análise e grava o motivo no histórico. Vai
 * por RPC, e não por update direto, por dois motivos: o motivo precisa cair na
 * MESMA linha de histórico que o trigger cria (senão o card volta para Em
 * análise sem ninguém saber por quê), e a transição precisa ser atômica com a
 * validação de quem pode recusar.
 */
export async function recusarEntregaOportunidade(id: string, motivo: string): Promise<void> {
  const texto = (motivo ?? "").trim();
  if (!motivoRecusaValido(texto)) {
    throw new Error(
      `Descreva o motivo da recusa (mínimo ${MOTIVO_RECUSA_MIN} caracteres) — ele fica no histórico do card.`,
    );
  }
  const { error } = await supabase.rpc("recusar_entrega_oportunidade", {
    p_id: id,
    p_motivo: texto,
  });
  if (error) throw error;
}

/** Tarefa 09 — define a data prevista de solução. Só admin (guard no banco). */
export async function definirDataPrevistaOportunidade(
  id: string,
  data: string | null,
): Promise<void> {
  const { data: row, error } = await supabase
    .from("oportunidades")
    .update({ data_prevista: data })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!row) {
    throw new Error(
      "Não foi possível salvar a data prevista. Apenas administradores podem definir.",
    );
  }
}

export async function historicoOportunidade(id: string): Promise<OportunidadeHistorico[]> {
  const { data, error } = await supabase
    .from("oportunidade_historico")
    .select("*")
    .eq("oportunidade_id", id)
    .order("mudado_em");
  if (error) throw error;
  const nomes = await mapNomesUsuarios((data ?? []).flatMap((h) => [h.mudado_por]));
  return (data ?? []).map((h) => ({
    ...(h as OportunidadeHistorico),
    mudado_por_nome: h.mudado_por ? (nomes.get(h.mudado_por) ?? null) : null,
  }));
}

/**
 * Busca oportunidades com títulos semelhantes (para anti-duplicata na
 * persona Reportar). Fuzzy simples via ILIKE por palavras > 4 chars.
 */
export async function buscarSimilares(titulo: string): Promise<Oportunidade[]> {
  const termos = titulo
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 4);
  if (!termos.length) return [];
  const filtro = termos.map((t) => `titulo.ilike.%${t}%`).join(",");
  const { data, error } = await supabase
    .from("oportunidades")
    .select("*")
    .or(filtro)
    .neq("status", "descartado")
    .neq("status", "entregue")
    .limit(5);
  if (error) throw error;
  return (data ?? []) as Oportunidade[];
}

/**
 * Etapas do Kanban. "aberto" saiu (17/08): duplicava o Backlog e ninguém usava
 * como etapa própria. Continua fora daqui de propósito — isOportStatus() usa
 * esta lista, então card legado em "aberto" cai no Backlog.
 */
export const STATUS_ORDEM: OportStatus[] = [
  "backlog",
  "em_analise",
  "planejado",
  "em_dev",
  "entregue",
  "descartado",
];
export const STATUS_LABEL: Record<OportStatus, string> = {
  backlog: "Backlog",
  /** Só para o histórico de quem passou por essa etapa antes dela sair. */
  aberto: "Aberto",
  em_analise: "Em análise",
  planejado: "Planejado",
  em_dev: "Em desenvolvimento",
  entregue: "Entregue",
  descartado: "Descartado",
};
export const PRIORIDADE_ORDEM: OportPrioridade[] = ["critica", "alta", "media", "baixa"];
export const PRIORIDADE_LABEL: Record<OportPrioridade, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};
export const PRIORIDADE_COR: Record<OportPrioridade, string> = {
  critica: "text-rose-700 bg-rose-50 border-rose-300",
  alta: "text-orange-700 bg-orange-50 border-orange-300",
  media: "text-slate-700 bg-slate-50 border-slate-300",
  baixa: "text-muted-foreground bg-muted/50 border-border",
};
export const TIPO_LABEL: Record<OportTipo, string> = {
  bug: "Bug",
  melhoria: "Melhoria",
  duvida: "Dúvida",
};

export const IMPACTO_ORDEM: OportImpacto[] = ["bloqueia", "atrapalha", "cosmetico"];
export const IMPACTO_LABEL: Record<OportImpacto, string> = {
  bloqueia: "Bloqueia",
  atrapalha: "Atrapalha",
  cosmetico: "Cosmético",
};

/** Ordenação da coluna do Kanban. */
export type OportOrdemColuna = "prioridade" | "registro_asc" | "registro_desc";

export function isOportStatus(s: string | null | undefined): s is OportStatus {
  return !!s && (STATUS_ORDEM as string[]).includes(s);
}

/** Agrupa cards por coluna do Kanban; status desconhecido cai em backlog. */
export function agruparPorStatus(opts: Oportunidade[]): Record<OportStatus, Oportunidade[]> {
  const map = Object.fromEntries(STATUS_ORDEM.map((s) => [s, [] as Oportunidade[]])) as Record<
    OportStatus,
    Oportunidade[]
  >;
  for (const o of opts) {
    const col = isOportStatus(o.status) ? o.status : "backlog";
    map[col].push(o);
  }
  return map;
}

/**
 * Ordena cards de uma etapa.
 * - prioridade: crítica → baixa, desempate por registro mais recente
 * - registro_asc: ordem de registro (FIFO — mais antigos primeiro)
 * - registro_desc: mais recentes primeiro
 */
export function ordenarColunaOportunidades(
  itens: Oportunidade[],
  ordem: OportOrdemColuna = "prioridade",
): Oportunidade[] {
  const prioRank = (p: OportPrioridade) => {
    const i = PRIORIDADE_ORDEM.indexOf(p);
    return i < 0 ? PRIORIDADE_ORDEM.length : i;
  };
  const copy = [...itens];
  if (ordem === "registro_asc") {
    return copy.sort((a, b) => a.criado_em.localeCompare(b.criado_em));
  }
  if (ordem === "registro_desc") {
    return copy.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  }
  return copy.sort((a, b) => {
    const pr = prioRank(a.prioridade) - prioRank(b.prioridade);
    if (pr !== 0) return pr;
    return a.criado_em.localeCompare(b.criado_em);
  });
}

/** Cicla o modo de ordenação da coluna (botão por etapa). */
export function proximaOrdemColuna(atual: OportOrdemColuna): OportOrdemColuna {
  if (atual === "prioridade") return "registro_asc";
  if (atual === "registro_asc") return "registro_desc";
  return "prioridade";
}

const STATUS_ATIVOS: OportStatus[] = ["backlog", "em_analise", "planejado", "em_dev"];

export type OportDashboardMes = {
  key: string;
  label: string;
  entregues: number;
  bugs: number;
};

export type OportDashboardMetrics = {
  total: number;
  entregues: number;
  aguardandoAprovacao: number;
  aprovados: number;
  bugsEntregues: number;
  bugsAbertos: number;
  bugsBloqueantesAbertos: number;
  emAndamento: number;
  planejados: number;
  serieEntregas: OportDashboardMes[];
  proximas: Oportunidade[];
};

/** Métricas do dashboard do Banco de Oportunidades (visão objetiva). */
export function metricasOportunidadesDashboard(
  opts: Oportunidade[],
  agora = new Date(),
): OportDashboardMetrics {
  const porStatus = agruparPorStatus(opts);
  const bugs = opts.filter((o) => o.tipo === "bug");
  const bugsEntregues = bugs.filter((o) => o.status === "entregue").length;
  const bugsAbertosList = bugs.filter((o) => STATUS_ATIVOS.includes(o.status));
  const aguardandoAprovacao = opts.filter(aguardandoAprovacaoCliente).length;
  const aprovados = opts.filter((o) => o.status === "entregue" && !!o.aprovado_autor_em).length;

  const serieEntregas: OportDashboardMes[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", "")
      .replace(/^\w/, (c) => c.toUpperCase());
    serieEntregas.push({ key, label, entregues: 0, bugs: 0 });
  }
  for (const o of opts) {
    if (o.status !== "entregue") continue;
    const ref = o.aprovado_autor_em ?? o.atualizado_em;
    const key = ref.slice(0, 7);
    const mes = serieEntregas.find((m) => m.key === key);
    if (!mes) continue;
    mes.entregues += 1;
    if (o.tipo === "bug") mes.bugs += 1;
  }

  const prioRank = (p: OportPrioridade) => PRIORIDADE_ORDEM.indexOf(p);
  // Backlog no lugar de Aberto — a etapa saiu do Kanban e agruparPorStatus só
  // devolve as colunas de STATUS_ORDEM (o card legado já cai no backlog).
  const proximas = [...porStatus.em_dev, ...porStatus.planejado, ...porStatus.backlog].sort(
    (a, b) => {
      const pr = prioRank(a.prioridade) - prioRank(b.prioridade);
      if (pr !== 0) return pr;
      return b.atualizado_em.localeCompare(a.atualizado_em);
    },
  );

  return {
    total: opts.length,
    entregues: porStatus.entregue.length,
    aguardandoAprovacao,
    aprovados,
    bugsEntregues,
    bugsAbertos: bugsAbertosList.length,
    bugsBloqueantesAbertos: bugsAbertosList.filter((o) => o.impacto === "bloqueia").length,
    emAndamento: porStatus.em_dev.length,
    planejados: porStatus.planejado.length,
    serieEntregas,
    proximas: proximas.slice(0, 8),
  };
}
