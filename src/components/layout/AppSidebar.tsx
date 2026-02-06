import {
  LayoutDashboard, Users, Ruler, Wallet, ClipboardList,
  CreditCard, HardHat, Truck, FileText, BarChart3, Settings,
  LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

const menuGroups = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Clientes", url: "/clients", icon: Users },
      { title: "Projetos", url: "/projects", icon: Ruler },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Orçamentos", url: "/budgets", icon: Wallet },
      { title: "Compras", url: "/purchases", icon: ClipboardList },
      { title: "Financeiro", url: "/financial", icon: CreditCard },
    ],
  },
  {
    label: "Operacional",
    items: [
      { title: "Acomp. de Obra", url: "/site-tracking", icon: HardHat },
      { title: "Fornecedores", url: "/suppliers", icon: Truck },
    ],
  },
  {
    label: "Arquivos",
    items: [
      { title: "Documentos", url: "/documents", icon: FileText },
      { title: "Relatórios", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Configurações", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <span className="px-4 py-2 block text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </span>
            )}
            {collapsed && <div className="my-1 mx-3 border-t border-sidebar-border" />}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => (
                <li key={item.url}>
                  <NavLink
                    to={item.url}
                    end={item.url === "/dashboard"}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                  >
                    <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
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