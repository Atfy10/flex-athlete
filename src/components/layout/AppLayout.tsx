import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, User, KeyRound, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-hidden">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex-shrink-0">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4 min-w-0">
                <SidebarTrigger className="lg:hidden" />
                <div className="text-gradient font-bold text-xl">
                  AURA Sport Academy
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>

                {/* Profile avatar dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="text-xs font-bold text-primary-foreground">A</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      My Account
                    </DropdownMenuLabel>
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
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
