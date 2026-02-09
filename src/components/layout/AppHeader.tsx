import { ChevronLeft, ChevronRight, LogOut, Menu, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsPanel } from "@/components/layout/NotificationsPanel";
import logoLight from "@/assets/logo-light.png";

interface AppHeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function AppHeader({ onMenuClick, showMenuButton, sidebarCollapsed, onToggleSidebar }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const email = user?.email ?? "";
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : email.charAt(0).toUpperCase();

  return (
    <header className="flex items-center justify-between h-14 px-4 lg:px-6 border-b border-sidebar-border bg-sidebar shrink-0">
      {/* Left side - Logo + toggle */}
      <div className="flex items-center gap-2">
        {showMenuButton ? (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        ) : (
          onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )
        )}

        {/* Logo in header when sidebar is collapsed */}
        {sidebarCollapsed && !showMenuButton && (
          <div className="h-10 overflow-hidden">
            <img
              src={logoLight}
              alt="Quadra Arquitetura"
              className="h-16 -mt-3 object-contain object-left animate-fade-in"
            />
          </div>
        )}

        {/* Logo in header on mobile */}
        {showMenuButton && (
          <div className="h-10 overflow-hidden">
            <img
              src={logoLight}
              alt="Quadra Arquitetura"
              className="h-16 -mt-3 object-contain object-left animate-fade-in"
            />
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationsPanel />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2 focus:ring-offset-sidebar">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-50 bg-popover">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {fullName && (
                  <p className="text-sm font-medium leading-none">{fullName}</p>
                )}
                <p className="text-xs leading-none text-muted-foreground">
                  {email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
