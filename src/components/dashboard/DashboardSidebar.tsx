import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  UserCircle,
  Settings,
  BarChart3,
  DollarSign,
  CreditCard,
  Gift,
  MessageSquare,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import logo from "@/assets/infobarber-logo.png";

const ownerMenuItems = [
  { title: "Início", url: "/dashboard", icon: LayoutDashboard },
  { title: "Agenda", url: "/dashboard/schedule", icon: Calendar },
  { title: "Serviços", url: "/dashboard/services", icon: Scissors },
  { title: "Equipe", url: "/dashboard/team", icon: Users },
  { title: "Clientes", url: "/dashboard/clients", icon: UserCircle },
  { title: "Relatórios", url: "/dashboard/reports", icon: BarChart3 },
  { title: "Fidelidade", url: "/dashboard/loyalty", icon: Gift },
  { title: "Meu Plano", url: "/dashboard/plans", icon: CreditCard },
  { title: "Suporte", url: "/dashboard/support", icon: MessageSquare },
  { title: "Configurações", url: "/dashboard/settings", icon: Settings },
];

const barberMenuItems = [
  { title: "Início", url: "/dashboard/my-dashboard", icon: LayoutDashboard },
  { title: "Minha Agenda", url: "/dashboard/my-schedule", icon: Calendar },
  { title: "Minha Comissão", url: "/dashboard/my-commission", icon: DollarSign },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role } = useUserRole();

  const menuItems = role === "barber" ? barberMenuItems : ownerMenuItems;

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <img src={logo} alt="InfoBarber" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          {!collapsed && (
            <span className="font-display font-bold text-foreground">InfoBarber</span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard" || item.url === "/dashboard/my-schedule"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-gold/10 text-gold"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
