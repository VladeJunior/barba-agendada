import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  Scissors, 
  BarChart3, 
  LogOut, 
  Settings,
  Plus,
  Clock
} from "lucide-react";
import logo from "@/assets/infobarber-logo.jpg";

interface Shop {
  id: string;
  name: string;
  slug: string;
}

interface Profile {
  full_name: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Fetch user's shop
      const fetchShop = async () => {
        const { data } = await supabase
          .from('shops')
          .select('id, name, slug')
          .eq('owner_id', user.id)
          .single();
        
        if (data) {
          setShop(data);
        }
      };

      // Fetch user's profile
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      };

      fetchShop();
      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = [
    { label: "Agendamentos Hoje", value: "0", icon: Calendar, color: "text-gold" },
    { label: "Clientes", value: "0", icon: Users, color: "text-blue-400" },
    { label: "Serviços", value: "0", icon: Scissors, color: "text-green-400" },
    { label: "Faturamento", value: "R$ 0", icon: BarChart3, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="InfoBarber" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">
                {shop?.name || "Minha Barbearia"}
              </h1>
              <p className="text-xs text-muted-foreground">Painel Administrativo</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              Olá, {profile?.full_name || user.email}
            </span>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
            Bem-vindo ao seu painel!
          </h2>
          <p className="text-muted-foreground">
            Gerencie sua barbearia, acompanhe agendamentos e muito mais.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} variant="elevated">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card variant="elevated" className="hover:border-gold/30 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-gold" />
                Novo Agendamento
              </CardTitle>
              <CardDescription>
                Agende um horário manualmente para um cliente
              </CardDescription>
            </CardHeader>
          </Card>

          <Card variant="elevated" className="hover:border-gold/30 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-gold" />
                Gerenciar Serviços
              </CardTitle>
              <CardDescription>
                Adicione, edite ou remova serviços da sua barbearia
              </CardDescription>
            </CardHeader>
          </Card>

          <Card variant="elevated" className="hover:border-gold/30 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" />
                Equipe
              </CardTitle>
              <CardDescription>
                Gerencie os barbeiros da sua equipe
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              Próximos Agendamentos
            </CardTitle>
            <CardDescription>
              Seus agendamentos de hoje e amanhã
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum agendamento encontrado</p>
              <p className="text-sm">Os agendamentos aparecerão aqui quando forem criados</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
