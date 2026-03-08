import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  MapPin,
  Trophy,
  Calendar,
  Layers,
  UserPlus,
  ClipboardCheck,
  User,
  Shield,
  Bell,
  KeyRound,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface RouteEntry {
  title: string;
  url: string;
  icon: React.ElementType;
  group: string;
  keywords?: string;
}

const routes: RouteEntry[] = [
  // Main
  { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Main", keywords: "home overview stats" },
  { title: "Notifications", url: "/notifications", icon: Bell, group: "Main", keywords: "alerts unread messages" },

  // Management
  { title: "Employees", url: "/employees", icon: Users, group: "Management", keywords: "staff hr people" },
  { title: "Coaches", url: "/coaches", icon: UserCheck, group: "Management", keywords: "trainers instructors" },
  { title: "Trainees", url: "/trainees", icon: GraduationCap, group: "Management", keywords: "students athletes members" },
  { title: "Branches", url: "/branches", icon: MapPin, group: "Management", keywords: "locations offices gyms" },
  { title: "Sports", url: "/sports", icon: Trophy, group: "Management", keywords: "activities disciplines" },

  // Operations
  { title: "Trainee Groups", url: "/trainee-groups", icon: Users, group: "Operations", keywords: "classes teams squads" },
  { title: "Sessions", url: "/sessions", icon: Layers, group: "Operations", keywords: "schedule plan" },
  { title: "Session Occurrences", url: "/session-occurrences", icon: Calendar, group: "Operations", keywords: "calendar dates timetable" },
  { title: "Enrollments", url: "/enrollments", icon: UserPlus, group: "Operations", keywords: "registration signup join" },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck, group: "Operations", keywords: "presence absence mark" },
  { title: "Profiles", url: "/profiles", icon: User, group: "Operations", keywords: "accounts users" },
  { title: "Users & Roles", url: "/users-roles", icon: Shield, group: "Operations", keywords: "permissions access admin" },

  // Account
  { title: "My Profile", url: "/my-profile", icon: User, group: "Account", keywords: "settings account info" },
  { title: "Change Password", url: "/my-profile?tab=password", icon: KeyRound, group: "Account", keywords: "security credentials" },
  { title: "My Roles", url: "/my-profile?tab=roles", icon: Shield, group: "Account", keywords: "permissions role" },
];

const groups = ["Main", "Management", "Operations", "Account"] as const;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const runCommand = useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      // Slight delay to let the dialog animate out before navigating
      setTimeout(fn, 80);
    },
    [onOpenChange],
  );

  const handleLogout = () => {
    runCommand(() => {
      logout();
      navigate("/login", { replace: true });
    });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {groups.map((group, i) => {
          const items = routes.filter((r) => r.group === group);
          return (
            <span key={group}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((route) => (
                  <CommandItem
                    key={route.url}
                    value={`${route.title} ${route.keywords ?? ""}`}
                    onSelect={() => runCommand(() => navigate(route.url))}
                    className="gap-3 cursor-pointer"
                  >
                    <route.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{route.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground font-mono truncate hidden sm:block">
                      {route.url}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </span>
          );
        })}

        <CommandSeparator />
        <CommandGroup heading="Danger">
          <CommandItem
            value="logout sign out"
            onSelect={handleLogout}
            className="gap-3 cursor-pointer text-destructive data-[selected=true]:text-destructive data-[selected=true]:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Footer hint */}
      <div className="border-t px-3 py-2 flex items-center gap-4 text-[11px] text-muted-foreground select-none">
        <span className="flex items-center gap-1">
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>
          open
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">Esc</kbd>
          close
        </span>
        <span className="ml-auto flex items-center gap-1">
          <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
          toggle
        </span>
      </div>
    </CommandDialog>
  );
}
