import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";

type MenuItem = { title: string; url: string; subItems?: { title: string; url: string }[] };
type MenuGroup = { label: string; items: MenuItem[] };

const menuGroups: MenuGroup[] = [
  {
    label: "Análises Quadra",
    items: [
      { title: "Dashboard Escritório", url: "/dashboard/escritorio" },
      { title: "Dashboard Obras", url: "/dashboard/obras" },
      { title: "Relatórios", url: "/construction/reports" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { title: "Leads", url: "/leads/pipeline" },
      {
        title: "Documentos",
        url: "/leads/proposals",
        subItems: [
          { title: "Propostas", url: "/leads/proposals" },
          { title: "Contratos", url: "/leads/contracts" },
        ],
      },
      { title: "Clientes", url: "/clients" },
    ],
  },
  {
    label: "Gestão de Obras",
    items: [
      { title: "Obras", url: "/projects" },
      { title: "Acompanhamento", url: "/construction/tracking" },
      {
        title: "Tarefas",
        url: "/construction/tasks",
        subItems: [
          { title: "Tarefas por Obra", url: "/construction/tasks" },
          { title: "Histórico de Voz", url: "/construction/voice-tasks" },
          { title: "Agenda", url: "/construction/agenda" },
        ],
      },
      { title: "Fornecedores", url: "/construction/suppliers" },
    ],
  },
  {
    label: "Gestão de Conteúdo",
    items: [
      { title: "Calendário", url: "/content/calendar" },
      { title: "Roteiros", url: "/content/scripts" },
      { title: "Publicações", url: "/content/posts" },
    ],
  },
  {
    label: "Administrativo",
    items: [
      { title: "Configurações", url: "/admin/settings" },
      { title: "Usuários", url: "/admin/users" },
      { title: "Notas Fiscais", url: "/admin/invoices" },
    ],
  },
];

const routeGroupMap: Record<string, string> = {
  "/dashboard": "Análises Quadra",
  "/leads": "Comercial",
  "/clients": "Comercial",
  "/projects": "Gestão de Obras",
  "/construction": "Gestão de Obras",
  "/content": "Gestão de Conteúdo",
  "/admin": "Administrativo",
};

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const getInitialGroups = (): Record<string, boolean> => {
    try {
      const saved = localStorage.getItem("sidebar_groups_state");
      if (saved) return JSON.parse(saved);
    } catch {}
    return Object.fromEntries(menuGroups.map((g) => [g.label, false]));
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialGroups);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const manualOverrides = useRef<Set<string>>(new Set());
  const location = useLocation();

  useEffect(() => {
    const prefix = Object.keys(routeGroupMap).find((p) => location.pathname.startsWith(p));
    if (prefix) {
      const activeLabel = routeGroupMap[prefix];
      setOpenGroups((prev) => {
        const next = { ...prev };
        if (!manualOverrides.current.has(activeLabel)) {
          next[activeLabel] = true;
        }
        return next;
      });
    }
  }, [location.pathname]);

  const toggleGroup = useCallback((label: string) => {
    manualOverrides.current.add(label);
    setOpenGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try { localStorage.setItem("sidebar_groups_state", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleSubMenu = (title: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isSubItemActive = (item: MenuItem) =>
    item.subItems?.some((sub) => location.pathname === sub.url) ?? false;

  return (
    <aside className="flex flex-col h-full w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center p-3 border-b border-sidebar-border">
        <div className="h-14 flex items-center flex-1">
          <img src={logoLight} alt="Quadra Arquitetura" className="h-14 object-contain object-left animate-fade-in" />
        </div>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-0.5">
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex items-center justify-between w-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
            >
              {group.label}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  !openGroups[group.label] && "-rotate-90"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                openGroups[group.label] ? "max-h-96" : "max-h-0"
              )}
            >
              <ul className="space-y-0.5 px-2 pb-1">
                {group.items.map((item) =>
                  item.subItems ? (
                    <li key={item.title}>
                      <button
                        onClick={() => toggleSubMenu(item.title)}
                        className={cn(
                          "flex items-center justify-between w-full rounded-md px-4 py-2 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isSubItemActive(item) && "text-sidebar-accent-foreground"
                        )}
                      >
                        {item.title}
                        <ChevronRight
                          className={cn(
                            "h-3 w-3 transition-transform duration-200",
                            (openSubMenus[item.title] || isSubItemActive(item)) && "rotate-90"
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-200",
                          (openSubMenus[item.title] || isSubItemActive(item)) ? "max-h-40" : "max-h-0"
                        )}
                      >
                        <ul className="space-y-0.5 pl-3 pt-0.5">
                          {item.subItems.map((sub) => (
                            <li key={sub.url}>
                              <NavLink
                                to={sub.url}
                                end
                                className="block rounded-md px-4 py-1.5 text-xs font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                                onClick={onNavigate}
                              >
                                {sub.title}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ) : (
                    <li key={item.url}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="block rounded-md px-4 py-2 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                        onClick={onNavigate}
                      >
                        {item.title}
                      </NavLink>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
