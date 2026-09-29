/**
 * Conteúdo editável do site institucional (rota /).
 *
 * Cada seção do site tem campos com chave fixa ("hero.title", "about.body"...).
 * O time edita na aba Configurações → Site; o que fica salvo em
 * `site_content` é só o que difere do padrão abaixo. A leitura sempre faz
 * merge com o padrão, então uma tabela vazia mostra o site de sempre.
 *
 * Tipos de campo:
 *   text      texto simples (uma linha)
 *   richtext  **negrito**, *itálico* e Enter = quebra de linha
 *             (linha em branco separa parágrafos onde o bloco tem parágrafos)
 *   image     URL pública; "" = imagem padrão que vem com o site
 *   list      lista de itens { title, desc, image? }
 */

export type SiteSectionKey = "hero" | "about" | "services" | "portfolio" | "contact" | "footer";

export const SITE_SECTION_KEYS: SiteSectionKey[] = ["hero", "about", "services", "portfolio", "contact", "footer"];

export type SiteFieldType = "text" | "richtext" | "image" | "list";

export interface SiteListItem {
  title: string;
  desc: string;
  image?: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  image: string;
}

export interface AboutContent {
  eyebrow: string;
  title: string;
  body: string;
  photo: string;
  credits: SiteListItem[];
}

export interface ServicesContent {
  eyebrow: string;
  title: string;
  items: SiteListItem[];
}

export interface PortfolioContent {
  eyebrow: string;
  title: string;
  linkLabel: string;
  linkUrl: string;
  items: SiteListItem[];
}

export interface ContactContent {
  eyebrow: string;
  title: string;
  text: string;
  formTitle: string;
  contacts: SiteListItem[];
}

export interface FooterContent {
  logo: string;
  tagline: string;
  address: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  legal: string;
  location: string;
}

export interface SiteContent {
  hero: HeroContent;
  about: AboutContent;
  services: ServicesContent;
  portfolio: PortfolioContent;
  contact: ContactContent;
  footer: FooterContent;
}

/* ------------------------------------------------------------------ */
/* Padrão (o site como estava em código)                               */
/* ------------------------------------------------------------------ */

export const SITE_DEFAULTS: SiteContent = {
  hero: {
    title: "A sua obra\n*sob controle.*",
    subtitle:
      "Gerenciamento de obra com design de interiores autoral. Cronograma, orcamento e entrega sem surpresas, do briefing a ultima peca instalada. Belo Horizonte e regiao.",
    ctaPrimary: "Fale conosco",
    ctaSecondary: "Nossos projetos",
    image: "",
  },
  about: {
    eyebrow: "QUEM SOMOS",
    title: "Camilla *&* Mariana",
    body: [
      "A Quadra nasceu do encontro de duas arquitetas com um proposito em comum: fazer com que a obra saia do papel do jeito que foi projetada, sem surpresas de prazo, orcamento ou acabamento.",
      "Nosso diferencial e o gerenciamento de obra integrado ao projeto. Cronograma, compras, fornecedores e supervisao de canteiro passam pela nossa gestao direta. A escuta guia o projeto; o processo garante a entrega. Atuamos em residencial, corporativo e health care em Belo Horizonte e regiao.",
      "Mais que entregar projetos, entregamos a tranquilidade de um processo bem conduzido, do briefing a ultima peca instalada.",
    ].join("\n\n"),
    photo: "",
    credits: [
      { title: "Camilla Quadra", desc: "Arquiteta pela FUMEC" },
      { title: "Mariana Marques", desc: "Arquiteta pela UFMG" },
    ],
  },
  services: {
    eyebrow: "NOSSOS SERVICOS",
    title: "O que fazemos de *melhor*",
    items: [
      {
        title: "Gerenciamento de Obra",
        desc: "Nosso diferencial. Cronograma, orcamento, compras e supervisao semanal no canteiro — tudo sob nossa gestao direta, com relatorios e previsibilidade em cada etapa.",
      },
      {
        title: "Design de Interiores",
        desc: "Projetos autorais com atencao a ambientacao, materiais, iluminacao e marcenaria sob medida — traduzindo a rotina e os afetos de cada cliente.",
      },
      {
        title: "Reformas turn-key",
        desc: "Planejamento e execucao de reformas complexas com gestao integrada de fornecedores. Entregamos a chave, nao uma lista de pendencias.",
      },
    ],
  },
  portfolio: {
    eyebrow: "NOSSO TRABALHO",
    title: "Projetos *selecionados*",
    linkLabel: "Ver mais no Instagram",
    linkUrl: "https://instagram.com/quadraarq",
    items: [
      { title: "Residencia contemporanea", desc: "Residencial", image: "" },
      { title: "Clinica de saude integrativa", desc: "Comercial", image: "" },
      { title: "Banheiro assinado", desc: "Interiores", image: "" },
    ],
  },
  contact: {
    eyebrow: "VAMOS CONVERSAR",
    title: "Tire sua obra\n*do papel*.",
    text: "Conta pra gente sobre o seu projeto. Em ate 48 horas uteis agendamos um diagnostico gratuito para entender o escopo, prazos e estimativa de investimento.",
    formTitle: "Solicite seu diagnostico gratuito",
    contacts: [
      { title: "@quadraarq", desc: "https://instagram.com/quadraarq" },
      { title: "(31) 97264-1970 · Camilla", desc: "https://wa.me/5531972641970" },
      { title: "(31) 91244-672 · Mariana", desc: "https://wa.me/553191244672" },
      { title: "contato@quadraarquitetura.com", desc: "mailto:contato@quadraarquitetura.com" },
      {
        title: "Rua Euler, 10 · sala 301 · Padre Eustaquio · BH/MG",
        desc: "https://maps.google.com/?q=Rua+Euler+10+Belo+Horizonte",
      },
    ],
  },
  footer: {
    logo: "",
    tagline: "Gerenciamento de obra, interiores e reformas turn-key. Projetos em Belo Horizonte/MG.",
    address: "Rua Euler, 10 · sala 301\nPadre Eustaquio · Belo Horizonte/MG\nCEP 30720-160",
    email: "contato@quadraarquitetura.com",
    instagramHandle: "@quadraarq",
    instagramUrl: "https://instagram.com/quadraarq",
    legal: "Quadra Arquitetura Ltda · CNPJ 46.731.679/0001-90",
    location: "Belo Horizonte · MG · Brasil",
  },
};

/* ------------------------------------------------------------------ */
/* Definição dos campos (o que o admin mostra)                         */
/* ------------------------------------------------------------------ */

export interface SiteFieldDef {
  /** Nome do campo dentro da seção (ex.: "title"). */
  name: string;
  type: SiteFieldType;
  label: string;
  hint?: string;
  /** Para list: rótulos das colunas e se o item tem imagem. */
  itemLabels?: { title: string; desc: string };
  itemImage?: boolean;
  /** Para image: largura máxima após redimensionar. */
  maxWidth?: number;
}

export interface SiteSectionDef {
  key: SiteSectionKey;
  label: string;
  description: string;
  fields: SiteFieldDef[];
}

const RICH_HINT = "*itálico* sai na cor de destaque";

export const SITE_SECTION_DEFINITIONS: SiteSectionDef[] = [
  {
    key: "hero",
    label: "Hero",
    description: "Primeira tela do site: foto de fundo, título e botões.",
    fields: [
      { name: "image", type: "image", label: "Foto de fundo", maxWidth: 2400 },
      { name: "title", type: "richtext", label: "Título", hint: RICH_HINT },
      { name: "subtitle", type: "richtext", label: "Subtítulo" },
      { name: "ctaPrimary", type: "text", label: "Botão principal" },
      { name: "ctaSecondary", type: "text", label: "Botão secundário" },
    ],
  },
  {
    key: "about",
    label: "Sobre",
    description: "Bloco \"Quem somos\" com foto das sócias.",
    fields: [
      { name: "photo", type: "image", label: "Foto", maxWidth: 1400 },
      { name: "eyebrow", type: "text", label: "Chamada (acima do título)" },
      { name: "title", type: "richtext", label: "Título", hint: "*texto* sai na cor de destaque" },
      { name: "body", type: "richtext", label: "Texto", hint: "Linha em branco separa parágrafos" },
      { name: "credits", type: "list", label: "Assinaturas", itemLabels: { title: "Nome", desc: "Formação" } },
    ],
  },
  {
    key: "services",
    label: "Serviços",
    description: "Cards de serviços (os ícones seguem a ordem dos cards).",
    fields: [
      { name: "eyebrow", type: "text", label: "Chamada (acima do título)" },
      { name: "title", type: "richtext", label: "Título", hint: RICH_HINT },
      { name: "items", type: "list", label: "Serviços", itemLabels: { title: "Nome do serviço", desc: "Descrição" } },
    ],
  },
  {
    key: "portfolio",
    label: "Portfólio",
    description: "Projetos em destaque e link para o Instagram.",
    fields: [
      { name: "eyebrow", type: "text", label: "Chamada (acima do título)" },
      { name: "title", type: "richtext", label: "Título", hint: RICH_HINT },
      { name: "linkLabel", type: "text", label: "Texto do link" },
      { name: "linkUrl", type: "text", label: "URL do link" },
      {
        name: "items",
        type: "list",
        label: "Projetos",
        itemLabels: { title: "Nome do projeto", desc: "Categoria" },
        itemImage: true,
        maxWidth: 1200,
      },
    ],
  },
  {
    key: "contact",
    label: "Contato",
    description: "Texto de chamada, canais de contato e título do formulário.",
    fields: [
      { name: "eyebrow", type: "text", label: "Chamada (acima do título)" },
      { name: "title", type: "richtext", label: "Título", hint: RICH_HINT },
      { name: "text", type: "richtext", label: "Texto" },
      {
        name: "contacts",
        type: "list",
        label: "Canais de contato",
        hint: "O ícone é escolhido pelo link: instagram.com, wa.me/tel:, mailto:, maps.",
        itemLabels: { title: "Texto exibido", desc: "Link" },
      },
      { name: "formTitle", type: "text", label: "Título do formulário" },
    ],
  },
  {
    key: "footer",
    label: "Rodapé",
    description: "Logo, descrição curta, endereço e dados legais.",
    fields: [
      { name: "logo", type: "image", label: "Logo", maxWidth: 800 },
      { name: "tagline", type: "richtext", label: "Descrição curta" },
      { name: "address", type: "richtext", label: "Endereço", hint: "Uma linha por item" },
      { name: "email", type: "text", label: "E-mail" },
      { name: "instagramHandle", type: "text", label: "Instagram (texto)" },
      { name: "instagramUrl", type: "text", label: "Instagram (link)" },
      { name: "legal", type: "text", label: "Linha legal (razão social / CNPJ)" },
      { name: "location", type: "text", label: "Localização (canto direito)" },
    ],
  },
];

export function getSiteSectionDefinition(key: SiteSectionKey): SiteSectionDef {
  return SITE_SECTION_DEFINITIONS.find((d) => d.key === key)!;
}

export function siteFieldKey(section: SiteSectionKey, field: string): string {
  return `${section}.${field}`;
}

/* ------------------------------------------------------------------ */
/* Leitura (linhas do banco → conteúdo resolvido)                      */
/* ------------------------------------------------------------------ */

/** Time dono do site público. Pode ser trocado por VITE_SITE_TEAM_ID. */
export const SITE_TEAM_ID: string =
  (import.meta.env?.VITE_SITE_TEAM_ID as string | undefined) || "00000000-0000-0000-0000-000000000001";

export interface SiteContentRow {
  key: string;
  type: string;
  value_json: unknown;
  updated_at?: string;
}

function cleanList(value: unknown, withImage: boolean): SiteListItem[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => {
      const item: SiteListItem = {
        title: typeof v.title === "string" ? v.title : "",
        desc: typeof v.desc === "string" ? v.desc : "",
      };
      if (withImage) item.image = typeof v.image === "string" ? v.image : "";
      return item;
    });
}

/** Valida o valor salvo contra o tipo do campo; null = inválido (usa padrão). */
function parseValue(def: SiteFieldDef, value: unknown): unknown {
  if (def.type === "list") return cleanList(value, !!def.itemImage);
  return typeof value === "string" ? value : null;
}

/** Mescla as linhas do banco com o padrão. Chaves desconhecidas são ignoradas. */
export function resolveSiteContent(rows: SiteContentRow[] | null | undefined): SiteContent {
  const byKey = new Map((rows ?? []).map((r) => [r.key, r]));
  const out = structuredClone(SITE_DEFAULTS) as unknown as Record<string, Record<string, unknown>>;
  for (const section of SITE_SECTION_DEFINITIONS) {
    for (const field of section.fields) {
      const row = byKey.get(siteFieldKey(section.key, field.name));
      if (!row) continue;
      const parsed = parseValue(field, row.value_json);
      if (parsed != null) out[section.key][field.name] = parsed;
    }
  }
  return out as unknown as SiteContent;
}

/* ------------------------------------------------------------------ */
/* Escrita (conteúdo editado → linhas)                                 */
/* ------------------------------------------------------------------ */

export interface SiteContentUpsert {
  key: string;
  type: SiteFieldType;
  value_json: unknown;
}

export interface SiteContentChanges {
  upserts: SiteContentUpsert[];
  /** Campos que voltaram ao padrão: a linha é apagada. */
  deletes: string[];
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Diferença entre o rascunho e o que está publicado.
 * Campo igual ao padrão não é gravado (a linha é removida se existir), para
 * que ajustes futuros no padrão em código continuem chegando no site.
 */
export function diffSiteContent(
  draft: SiteContent,
  published: SiteContent,
  existingKeys: Iterable<string>,
): SiteContentChanges {
  const existing = new Set(existingKeys);
  const upserts: SiteContentUpsert[] = [];
  const deletes: string[] = [];
  const d = draft as unknown as Record<string, Record<string, unknown>>;
  const p = published as unknown as Record<string, Record<string, unknown>>;
  const def = SITE_DEFAULTS as unknown as Record<string, Record<string, unknown>>;
  for (const section of SITE_SECTION_DEFINITIONS) {
    for (const field of section.fields) {
      const key = siteFieldKey(section.key, field.name);
      const next = d[section.key][field.name];
      if (sameValue(next, def[section.key][field.name])) {
        if (existing.has(key)) deletes.push(key);
        continue;
      }
      if (existing.has(key) && sameValue(next, p[section.key][field.name])) continue;
      upserts.push({ key, type: field.type, value_json: next });
    }
  }
  return { upserts, deletes };
}

export function siteSectionEqual(a: SiteContent, b: SiteContent, section: SiteSectionKey): boolean {
  return sameValue(a[section], b[section]);
}

export function siteContentEqual(a: SiteContent, b: SiteContent): boolean {
  return SITE_SECTION_KEYS.every((k) => siteSectionEqual(a, b, k));
}

/* ------------------------------------------------------------------ */
/* Apoio à renderização                                                */
/* ------------------------------------------------------------------ */

/** Divide um richtext em parágrafos (linha em branco separa). */
export function splitParagraphs(text: string): string[] {
  return (text ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export type ContactIconKind = "instagram" | "phone" | "mail" | "map" | "link";

/** Ícone do canal de contato a partir do link. */
export function contactIconKind(href: string): ContactIconKind {
  const h = (href ?? "").toLowerCase();
  if (h.includes("instagram.com")) return "instagram";
  if (h.startsWith("mailto:")) return "mail";
  if (h.includes("wa.me") || h.includes("whatsapp") || h.startsWith("tel:")) return "phone";
  if (h.includes("maps.") || h.includes("goo.gl/maps") || h.includes("/maps")) return "map";
  return "link";
}
