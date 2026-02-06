import {
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";

const menuGroups = [
  {
    label: "Principal",
    items: [
      { title: "Escritório", url: "/dashboard/escritorio" },
      { title: "Obras", url: "/dashboard/obras" },
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

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(menuGroups.map((g) => [g.label, false]))
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="flex flex-col h-full w-64 border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center p-3 border-b border-sidebar-border">
        <div className="h-16 overflow-hidden flex-1">
          <img src={logoLight} alt="Quadra Arquitetura" className="h-24 -mt-4 object-contain object-left animate-fade-in" />
        </div>
      </div>

      {/* Navigation */}
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
                {group.items.map((item) => (
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
                ))}
              </ul>
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
