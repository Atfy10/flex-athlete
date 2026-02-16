import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  MapPin,
  Trophy,
  Calendar,
  UserPlus,
  ClipboardCheck,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const mainItems = [{ title: "Dashboard", url: "/", icon: LayoutDashboard }];

const managementItems = [
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Coaches", url: "/coaches", icon: UserCheck },
  { title: "Trainees", url: "/trainees", icon: GraduationCap },
  { title: "Branches", url: "/branches", icon: MapPin },
  { title: "Sports", url: "/sports", icon: Trophy },
];

const operationsItems = [
  { title: "Trainee Groups", url: "/trainee-groups", icon: Users },
  { title: "Session Occurrences", url: "/session-occurrences", icon: Calendar },
  { title: "Enrollments", url: "/enrollments", icon: UserPlus },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
  { title: "Profiles", url: "/profiles", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const [managementOpen, setManagementOpen] = useState(true);
  const [operationsOpen, setOperationsOpen] = useState(true);

  const isActive = (path: string) => currentPath === path;
  const navItemCls =
    "transition-all duration-200 hover:translate-x-[1px] text-muted-foreground hover:text-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:border-r-4 data-[active=true]:border-primary data-[active=true]:font-semibold data-[active=true]:shadow-md";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent className="py-4">
        {/* Logo */}
        <div className="px-4 mb-6">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-gradient">AURA</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className={navItemCls}
                  >
                    <NavLink to={item.url} end>
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Section */}
        <Collapsible open={managementOpen} onOpenChange={setManagementOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 p-2 rounded-md">
                <div className="flex items-center justify-between w-full">
                  {!collapsed && <span>Management</span>}
                  {!collapsed && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        managementOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        className={navItemCls}
                      >
                        <NavLink to={item.url}>
                          <item.icon className="h-5 w-5" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Operations Section */}
        <Collapsible open={operationsOpen} onOpenChange={setOperationsOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 p-2 rounded-md">
                <div className="flex items-center justify-between w-full">
                  {!collapsed && <span>Operations</span>}
                  {!collapsed && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        operationsOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {operationsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        className={navItemCls}
                      >
                        <NavLink to={item.url}>
                          <item.icon className="h-5 w-5" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        {/* Logout */}
        <div className="mt-auto px-2 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
