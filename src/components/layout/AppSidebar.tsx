import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LayoutGrid,
  HardHat,
  FileBarChart,
  Users,
  FileText,
  FileSignature,
  UserCheck,
  Building2,
  ClipboardList,
  CheckSquare,
  ListChecks,
  Truck,
  CalendarRange,
  Film,
  Send,
  Instagram,
  Settings,
  Shield,
  Receipt,
  LucideIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type MenuItem = { title: string; url: string; subItems?: { title: string; url: string }[] };
type MenuGroup = { label: string; items: MenuItem[] };

const iconMap: Record<string, LucideIcon> = {
  "Dashboard Escritório": LayoutDashboard,
  "Dashboard Obras": HardHat,
  "Relatórios": FileBarChart,
  "Leads": Users,
  "Documentos": FileText,
  "Propostas": FileText,
  "Contratos": FileSignature,
  "Clientes": UserCheck,
  "Obras": Building2,
  "Kanban": LayoutGrid,
  "Acompanhamento": ClipboardList,
  "Tarefas": CheckSquare,
  "Tarefas por Obra": CheckSquare,
  "Tarefas Quadra": ListChecks,
  "Fornecedores": Truck,
  "Calendário": CalendarRange,
  "Roteiros": Film,
  "Publicações": Send,
  "Instagrams": Instagram,
  "Configurações": Settings,
  "Usuários": Shield,
  "Notas Fiscais": Receipt,
};

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
      { title: "Kanban", url: "/projects/kanban" },
      { title: "Acompanhamento", url: "/construction/tracking" },
      {
        title: "Tarefas",
        url: "/construction/tasks",
        subItems: [
          { title: "Tarefas por Obra", url: "/construction/tasks" },
          { title: "Tarefas Quadra", url: "/construction/voice-tasks" },
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
      { title: "Instagrams", url: "/content/instagram" },
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
  collapsed?: boolean;
}

export function AppSidebar({ onNavigate, collapsed = false }: AppSidebarProps) {
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
  const navigate = useNavigate();

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

  const getIcon = (title: string) => {
    const Icon = iconMap[title];
    return Icon ? <Icon className="h-4 w-4 shrink-0" /> : null;
  };

  // --- COLLAPSED (mini) MODE ---
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <aside className="flex flex-col h-full w-16 border-r border-sidebar-border bg-sidebar transition-all duration-200">
          <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
            <div className="h-9 w-9 rounded-xl bg-sidebar-primary/15 grid place-items-center">
              <LayoutDashboard className="h-4 w-4 text-sidebar-primary" />
            </div>
          </div>

          <nav className="flex-1 py-3 overflow-y-auto scrollbar-sidebar">
            {menuGroups.map((group, gi) => (
              <div key={group.label} className={cn(gi > 0 && "mt-2 pt-2 border-t border-sidebar-border/40")}>
                {group.items.map((item) => {
                  if (item.subItems) {
                    return (
                      <CollapsedSubMenu
                        key={item.title}
                        item={item}
                        icon={getIcon(item.title)}
                        isActive={isSubItemActive(item)}
                        onNavigate={onNavigate}
                      />
                    );
                  }
                  const active = location.pathname === item.url;
                  return (
                    <Tooltip key={item.url}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { navigate(item.url); onNavigate?.(); }}
                          className={cn(
                            "relative flex items-center justify-center w-full h-11 text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors group",
                            active && "text-sidebar-foreground"
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-sidebar-primary" />
                          )}
                          <span className={cn(
                            "h-9 w-9 rounded-xl grid place-items-center transition-colors",
                            active
                              ? "bg-sidebar-primary/15 text-sidebar-primary"
                              : "group-hover:bg-sidebar-accent"
                          )}>
                            {getIcon(item.title)}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>
      </TooltipProvider>
    );
  }

  // --- EXPANDED MODE ---
  return (
    <aside className="flex flex-col h-full w-[260px] border-r border-sidebar-border bg-sidebar transition-all duration-200">
      <div className="flex items-center px-5 h-16 border-b border-sidebar-border">
        <img src={logoLight} alt="Quadra Arquitetura" className="h-12 object-contain object-left animate-fade-in" />
      </div>

      <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-sidebar">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/55 hover:text-sidebar-foreground transition-colors"
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
                openGroups[group.label] ? "max-h-[480px]" : "max-h-0"
              )}
            >
              <ul className="space-y-0.5 pt-1">
                {group.items.map((item) =>
                  item.subItems ? (
                    <li key={item.title}>
                      <button
                        onClick={() => toggleSubMenu(item.title)}
                        className={cn(
                          "flex items-center justify-between w-full rounded-lg pl-3 pr-2 py-2 text-sm font-medium text-sidebar-foreground/80 transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          isSubItemActive(item) && "text-sidebar-foreground"
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          {getIcon(item.title)}
                          {item.title}
                        </span>
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-200 text-sidebar-foreground/50",
                            (openSubMenus[item.title] || isSubItemActive(item)) && "rotate-90"
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-200",
                          (openSubMenus[item.title] || isSubItemActive(item)) ? "max-h-60" : "max-h-0"
                        )}
                      >
                        <ul className="space-y-0.5 pl-4 pt-0.5">
                          {item.subItems.map((sub) => (
                            <li key={sub.url}>
                              <NavLink
                                to={sub.url}
                                end
                                className="relative flex items-center gap-2 rounded-md pl-3 pr-3 py-1.5 text-[13px] font-medium text-sidebar-foreground/75 transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                activeClassName="bg-sidebar-primary/15 text-sidebar-foreground [&_svg]:text-sidebar-primary"
                                onClick={onNavigate}
                              >
                                {getIcon(sub.title)}
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
                        className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        activeClassName="bg-sidebar-primary/15 text-sidebar-foreground [&_svg]:text-sidebar-primary [&]:before:content-[''] [&]:before:absolute [&]:before:left-0 [&]:before:top-1.5 [&]:before:bottom-1.5 [&]:before:w-[3px] [&]:before:rounded-r [&]:before:bg-sidebar-primary"
                        onClick={onNavigate}
                      >
                        {getIcon(item.title)}
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

// Sub-component for collapsed sub-menu items with popover
function CollapsedSubMenu({
  item,
  icon,
  isActive,
  onNavigate,
}: {
  item: MenuItem;
  icon: React.ReactNode;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center w-full h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
        >
          {icon}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-44 p-1">
        {item.subItems?.map((sub) => (
          <button
            key={sub.url}
            onClick={() => { navigate(sub.url); onNavigate?.(); }}
            className={cn(
              "flex items-center gap-2 w-full rounded-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors",
              location.pathname === sub.url && "bg-accent text-accent-foreground"
            )}
          >
            {iconMap[sub.title] && (() => { const I = iconMap[sub.title]; return <I className="h-3.5 w-3.5" />; })()}
            {sub.title}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
