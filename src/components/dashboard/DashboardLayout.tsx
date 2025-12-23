import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscription } from "@/hooks/useSubscription";
import { useShop } from "@/hooks/useShop";
import { useWhatsAppStatus } from "@/hooks/useWhatsAppStatus";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { SubscriptionWarningBanner } from "./SubscriptionWarningBanner";
import { WhatsAppTour } from "./WhatsAppTour";
import { AccountDialog } from "./AccountDialog";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, Key } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/infobarber-logo.jpg";

export function DashboardLayout() {
  const { user, loading, signOut } = useAuth();
  const { role, isLoading: roleLoading } = useUserRole();
  const { 
    needsPlanSelection, 
    isLoading: subscriptionLoading, 
    isBlocked, 
    isInGracePeriod, 
    graceDaysRemaining,
    daysUntilExpiration,
    status,
    isTrialExpired,
  } = useSubscription();
  const { data: shop } = useShop();
  const { connectionStatus, isWapiConfigured } = useWhatsAppStatus();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  // Fetch user profile to get full name
  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Redirect to plans page if user hasn't selected a plan yet
  useEffect(() => {
    if (subscriptionLoading) return;
    
    if (needsPlanSelection && location.pathname !== "/dashboard/plans") {
      navigate("/dashboard/plans");
    }
  }, [needsPlanSelection, subscriptionLoading, location.pathname, navigate]);

  // Redirect blocked users to plans page
  useEffect(() => {
    if (subscriptionLoading || needsPlanSelection) return;
    
    if (isBlocked && location.pathname !== "/dashboard/plans") {
      navigate("/dashboard/plans");
    }
  }, [isBlocked, subscriptionLoading, needsPlanSelection, location.pathname, navigate]);

  // Redirect barbers to their dashboard if they try to access owner-only pages
  useEffect(() => {
    if (roleLoading || !role || needsPlanSelection) return;

    const ownerOnlyPaths = ["/dashboard/services", "/dashboard/team", "/dashboard/clients", "/dashboard/reports", "/dashboard/settings", "/dashboard/schedule"];

    if (role === "barber") {
      // Redirect barber from owner-only pages or dashboard home
      if (ownerOnlyPaths.some(p => location.pathname.startsWith(p)) || location.pathname === "/dashboard") {
        navigate("/dashboard/my-dashboard");
      }
    }
  }, [role, roleLoading, needsPlanSelection, location.pathname, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    
    setSendingResetEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email: user.email },
      });

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email de recuperação.",
        variant: "destructive",
      });
    } finally {
      setSendingResetEmail(false);
    }
  };

  if (loading || roleLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If user needs to select a plan, show minimal layout
  if (needsPlanSelection) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
          {shop?.logo_url ? (
            <img src={shop.logo_url} alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <img src={logo} alt="InfoBarber" className="h-8" />
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <WhatsAppTour connectionStatus={connectionStatus} isWapiConfigured={isWapiConfigured} />
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || user?.email?.split("@")[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {role === "owner" && (
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setAccountDialogOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Minha Conta
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleResetPassword}
                    disabled={sendingResetEmail}
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {sendingResetEmail ? "Enviando..." : "Alterar Senha"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
            
            <AccountDialog 
              open={accountDialogOpen} 
              onOpenChange={setAccountDialogOpen} 
            />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {/* Subscription Warning Banner */}
            {status === "past_due" && (
              <SubscriptionWarningBanner 
                status="past_due" 
                graceDaysRemaining={graceDaysRemaining ?? undefined} 
              />
            )}
            {isTrialExpired && status === "trial" && (
              <SubscriptionWarningBanner status="trial_expired" />
            )}
            {status === "active" && daysUntilExpiration !== null && daysUntilExpiration <= 5 && (
              <SubscriptionWarningBanner 
                status="past_due" 
                daysUntilExpiration={daysUntilExpiration} 
              />
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
