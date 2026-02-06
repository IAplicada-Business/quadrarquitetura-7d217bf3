import {
  LogOut, ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";

const menuGroups = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/dashboard" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Clientes", url: "/clients" },
      { title: "Projetos", url: "/projects" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Orçamentos", url: "/budgets" },
      { title: "Compras", url: "/purchases" },
      { title: "Pagamentos", url: "/financial" },
    ],
  },
  {
    label: "Operacional",
    items: [
      { title: "Acomp. de Obra", url: "/site-tracking" },
      { title: "Fornecedores", url: "/suppliers" },
    ],
  },
  {
    label: "Arquivos",
    items: [
      { title: "Documentos", url: "/documents" },
      { title: "Relatórios", url: "/reports" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configurações", url: "/settings" },
    ],
  },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(menuGroups.map((g) => [g.label, true]))
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <img src={logoLight} alt="Quadra Arquitetura" className="h-14 animate-fade-in" />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-0.5">
            {!collapsed ? (
              <>
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:text-sidebar-foreground/90 transition-colors"
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
                    {group.items.map((item) => (
                      <li key={item.url}>
                        <NavLink
                          to={item.url}
                          end={item.url === "/dashboard"}
                          className="block rounded-md px-4 py-2 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                        >
                          {item.title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="my-1 mx-3 border-t border-sidebar-border" />
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}