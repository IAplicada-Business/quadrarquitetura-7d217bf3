// Registro central de telas para controle de acesso por usuário.
//
// Cada tela tem uma chave estável (page_key gravado em user_permissions),
// um rótulo pra UI de administração, a URL "principal" (pra onde navegar
// ao dar acesso) e os prefixos de rota que ela cobre.
//
// É a fonte única usada por: AdminUsersPage (checkboxes), AppSidebar
// (esconder menus) e PermissionGate (bloquear rota digitada na mão).

export interface PageDef {
  key: string;
  label: string;
  url: string;
  prefixes: string[];
}

export interface PageGroup {
  group: string;
  pages: PageDef[];
}

export const PAGE_GROUPS: PageGroup[] = [
  {
    group: "Análises Quadra",
    pages: [
      { key: "dashboard_escritorio", label: "Dashboard Comercial", url: "/dashboard/escritorio", prefixes: ["/dashboard/escritorio"] },
      { key: "dashboard_obras", label: "Dashboard Obras", url: "/dashboard/obras", prefixes: ["/dashboard/obras"] },
    ],
  },
  {
    group: "Financeiro",
    pages: [
      { key: "financeiro_dashboard", label: "Dashboard Financeiro", url: "/dashboard/financeiro", prefixes: ["/dashboard/financeiro"] },
      { key: "financeiro_lancamentos", label: "Lançamentos", url: "/financeiro/lancamentos", prefixes: ["/financeiro/lancamentos"] },
      { key: "financeiro_nf", label: "Notas Fiscais", url: "/admin/invoices", prefixes: ["/admin/invoices"] },
    ],
  },
  {
    group: "Tarefas",
    pages: [
      { key: "construction_tasks", label: "Tarefas (Kanban e Áudio)", url: "/tasks/projetos", prefixes: ["/tasks", "/construction/voice-tasks", "/construction/agenda"] },
    ],
  },
  {
    group: "Comercial",
    pages: [
      { key: "leads_pipeline", label: "Leads (Pipeline)", url: "/leads/pipeline", prefixes: ["/leads/pipeline", "/leads/"] },
      { key: "leads_proposals", label: "Propostas", url: "/leads/proposals", prefixes: ["/leads/proposals"] },
      { key: "leads_contracts", label: "Contratos", url: "/leads/contracts", prefixes: ["/leads/contracts"] },
      { key: "clients", label: "Clientes", url: "/clients", prefixes: ["/clients"] },
    ],
  },
  {
    group: "Gestão de Obras",
    pages: [
      { key: "projects", label: "Obras (Lista e Detalhe)", url: "/projects", prefixes: ["/projects"] },
      { key: "construction_tracking", label: "Acompanhamento", url: "/construction/tracking", prefixes: ["/construction/tracking"] },
      { key: "construction_suppliers", label: "Fornecedores", url: "/construction/suppliers", prefixes: ["/construction/suppliers"] },
      { key: "construction_documents", label: "Documentos", url: "/construction/documents", prefixes: ["/construction/documents"] },
      { key: "construction_reports", label: "Relatórios", url: "/construction/reports", prefixes: ["/construction/reports"] },
    ],
  },
  {
    group: "Gestão de Conteúdo",
    pages: [
      { key: "content_calendar", label: "Calendário", url: "/content/calendar", prefixes: ["/content/calendar"] },
      { key: "content_scripts", label: "Roteiros", url: "/content/scripts", prefixes: ["/content/scripts"] },
      { key: "content_posts", label: "Publicações", url: "/content/posts", prefixes: ["/content/posts"] },
      { key: "content_instagram", label: "Social", url: "/content/instagram", prefixes: ["/content/instagram"] },
    ],
  },
  {
    group: "Administrativo",
    pages: [
      { key: "admin_settings", label: "Configurações", url: "/admin/settings", prefixes: ["/admin/settings"] },
      { key: "admin_users", label: "Usuários", url: "/admin/users", prefixes: ["/admin/users"] },
    ],
  },
];

export const ALL_PAGES: PageDef[] = PAGE_GROUPS.flatMap(g => g.pages);

// Prefixos mais específicos primeiro, pra "/leads/proposals" resolver
// como leads_proposals e não cair no genérico "/leads/".
const PREFIX_INDEX: { prefix: string; key: string }[] = ALL_PAGES
  .flatMap(p => p.prefixes.map(prefix => ({ prefix, key: p.key })))
  .sort((a, b) => b.prefix.length - a.prefix.length);

/**
 * Resolve o page_key de um pathname. Retorna null para rotas não
 * mapeadas (ex: /notifications) — essas nunca são bloqueadas.
 */
export function resolvePageKey(pathname: string): string | null {
  for (const { prefix, key } of PREFIX_INDEX) {
    const base = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    if (pathname === base || pathname.startsWith(base + "/")) {
      return key;
    }
  }
  return null;
}

/** URL da primeira tela que o usuário pode ver, na ordem dos grupos. */
export function firstAllowedUrl(canView: (key: string) => boolean): string | null {
  for (const page of ALL_PAGES) {
    if (canView(page.key)) return page.url;
  }
  return null;
}
