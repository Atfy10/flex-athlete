import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { SessionExpiryBanner } from "@/components/SessionExpiryBanner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bell, Search, User, KeyRound, LogOut, Shield, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { RealtimeProvider, useRealtime } from "@/contexts/RealtimeContext";
import { cn } from "@/lib/utils";
import { FloatingDashboardButton } from "@/components/navigation/FloatingDashboardButton";
import { CommandPalette } from "@/components/navigation/CommandPalette";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

/** Derive up-to-2-char initials from a name or email string */
function getInitials(nameOrEmail: string): string {
  if (!nameOrEmail) return "U";
  const base = nameOrEmail.includes("@")
    ? nameOrEmail.split("@")[0]
    : nameOrEmail;
  const parts = base.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

/** Inner content — lives inside SidebarProvider so useSidebar is available */
function AppLayoutContent({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { logout, devUser, token } = useAuth();
  const { unreadCount } = useRealtime();
  const { state, isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  // Only show Dashboard shortcut on desktop when sidebar is collapsed.
  // On mobile the sidebar uses a sheet overlay — state stays "expanded".
  const showDashboardButton = !isMobile && state === "collapsed";

  // Register global keyboard shortcuts (Alt+D / Ctrl+Shift+D → Dashboard; Cmd/Ctrl+K → palette)
  useGlobalShortcuts(() => setPaletteOpen((o) => !o));

  // ── Update browser tab title with unread count ──────────────────────────
  useEffect(() => {
    const base = "AURA Sport Academy";
    document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
    return () => { document.title = base; };
  }, [unreadCount]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName: string = (() => {
    if (devUser) return devUser.name;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1])) as {
          unique_name?: string;
          name?: string;
          email?: string;
        };
        return payload.unique_name ?? payload.name ?? payload.email ?? "User";
      } catch {
        return "User";
      }
    }
    return "User";
  })();

  const displayEmail: string = (() => {
    if (devUser) return devUser.email;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1])) as {
          email?: string;
        };
        return payload.email ?? "";
      } catch {
        return "";
      }
    }
    return "";
  })();

  const initials = getInitials(displayName);

  return (
    <div className="min-h-screen flex w-full bg-background overflow-hidden">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex-shrink-0">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-3 min-w-0">
              {/* Always-visible sidebar toggle with Ctrl+B hint */}
              <TooltipProvider delayDuration={500}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarTrigger />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Toggle Sidebar{" "}
                    <kbd className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                      Ctrl+B
                    </kbd>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Dashboard shortcut — desktop only, when sidebar is collapsed */}
              {showDashboardButton && <FloatingDashboardButton inline />}
              <div className="text-gradient font-bold text-xl truncate">
                AURA Sport Academy
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Command Palette trigger */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground px-3 border border-border/60 rounded-md h-8"
                onClick={() => setPaletteOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
                <span className="text-xs">Search…</span>
                <kbd className="ml-1 rounded bg-muted px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
              </Button>
              {/* Mobile search icon */}
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setPaletteOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Theme toggle */}
              <TooltipProvider delayDuration={500}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    >
                      {theme === "dark" ? (
                        <Sun className="h-5 w-5" />
                      ) : (
                        <Moon className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Notification bell */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate("/notifications")}
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span
                    className={cn(
                      "absolute top-1 right-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold leading-none",
                      unreadCount > 99
                        ? "h-4 w-5 text-[9px]"
                        : "h-4 w-4 text-[10px]",
                    )}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Profile avatar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="text-xs font-bold text-primary-foreground">
                      {initials}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold leading-none truncate">
                      {displayName}
                    </p>
                    {displayEmail && displayEmail !== displayName && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {displayEmail}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => navigate("/my-profile")}
                  >
                    <User className="h-4 w-4" />
                    View My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => navigate("/my-profile?tab=roles")}
                  >
                    <Shield className="h-4 w-4" />
                    My Roles
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => navigate("/my-profile?tab=password")}
                  >
                    <KeyRound className="h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

/** Inner layout — wraps content with SidebarProvider + Toaster */
function AppLayoutInner({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
      <Toaster />
      <SessionExpiryBanner />
    </SidebarProvider>
  );
}

/** Outer wrapper — mounts RealtimeProvider then renders the inner layout */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <RealtimeProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </RealtimeProvider>
  );
}
