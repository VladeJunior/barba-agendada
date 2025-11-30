import { useShop } from "@/hooks/useShop";
import { useServices } from "@/hooks/useServices";
import { useBarbers } from "@/hooks/useBarbers";
import { useAppointments } from "@/hooks/useAppointments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Scissors, BarChart3, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function DashboardHome() {
  const { data: shop, isLoading: shopLoading } = useShop();
  const { data: services = [] } = useServices();
  const { data: barbers = [] } = useBarbers();
  const { data: appointments = [] } = useAppointments(new Date());
  const navigate = useNavigate();

  const todayAppointments = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "no_show"
  );
  const completedToday = appointments.filter((a) => a.status === "completed");
  const revenue = completedToday.reduce((sum, a) => sum + (a.service?.price || 0), 0);

  const stats = [
    { label: "Agendamentos Hoje", value: todayAppointments.length.toString(), icon: Calendar, color: "text-gold" },
    { label: "Barbeiros Ativos", value: barbers.filter(b => b.is_active).length.toString(), icon: Users, color: "text-blue-400" },
    { label: "Serviços", value: services.filter(s => s.is_active).length.toString(), icon: Scissors, color: "text-green-400" },
    { label: "Faturamento Hoje", value: `R$ ${revenue.toFixed(2)}`, icon: BarChart3, color: "text-purple-400" },
  ];

  if (shopLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
          Bem-vindo, {shop?.name || "sua barbearia"}!
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card 
          variant="elevated" 
          className="hover:border-gold/30 transition-colors cursor-pointer"
          onClick={() => navigate("/dashboard/schedule")}
        >
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

        <Card 
          variant="elevated" 
          className="hover:border-gold/30 transition-colors cursor-pointer"
          onClick={() => navigate("/dashboard/services")}
        >
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

        <Card 
          variant="elevated" 
          className="hover:border-gold/30 transition-colors cursor-pointer"
          onClick={() => navigate("/dashboard/team")}
        >
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
            Seus agendamentos de hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum agendamento para hoje</p>
              <p className="text-sm">Os agendamentos aparecerão aqui quando forem criados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {appointment.client_name || "Cliente"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.service?.name} • {appointment.barber?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gold">
                      {format(new Date(appointment.start_time), "HH:mm")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      R$ {appointment.service?.price?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
              {todayAppointments.length > 5 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/dashboard/schedule")}
                >
                  Ver todos ({todayAppointments.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
