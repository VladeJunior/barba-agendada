import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useBarbers } from "@/hooks/useBarbers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, CheckCircle, User, ArrowRight } from "lucide-react";
import { format, parseISO, startOfDay, endOfDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const statusColors = {
  scheduled: "bg-blue-500/20 text-blue-400",
  confirmed: "bg-green-500/20 text-green-400",
  completed: "bg-gold/20 text-gold",
  cancelled: "bg-red-500/20 text-red-400",
  no_show: "bg-gray-500/20 text-gray-400",
};

const statusLabels = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export default function BarberDashboardHome() {
  const { barberId, shopId } = useUserRole();
  const { data: barbers = [] } = useBarbers();
  
  const currentBarber = barbers.find(b => b.id === barberId);
  const commissionRate = currentBarber?.commission_rate ?? 0;

  const today = new Date();

  // Fetch today's appointments
  const { data: todayAppointments = [], isLoading } = useQuery({
    queryKey: ["barber-today-appointments", barberId],
    queryFn: async () => {
      if (!barberId || !shopId) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name, price, duration_minutes)
        `)
        .eq("barber_id", barberId)
        .eq("shop_id", shopId)
        .gte("start_time", startOfDay(today).toISOString())
        .lte("start_time", endOfDay(today).toISOString())
        .neq("status", "cancelled")
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!barberId && !!shopId,
  });

  // Calculate stats
  const completedToday = todayAppointments.filter(a => a.status === "completed");
  const pendingToday = todayAppointments.filter(a => a.status === "scheduled" || a.status === "confirmed");
  const upcomingAppointments = pendingToday.filter(a => isAfter(parseISO(a.start_time), new Date()));

  const todayRevenue = completedToday.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);
  const todayCommission = todayRevenue * (commissionRate / 100);
  const expectedRevenue = todayAppointments.reduce((sum, apt) => sum + (apt.service?.price || 0), 0);
  const expectedCommission = expectedRevenue * (commissionRate / 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Olá, {currentBarber?.name?.split(" ")[0] || "Barbeiro"}! 👋
        </h1>
        <p className="text-muted-foreground">
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Atendimentos Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedToday.length} concluídos • {pendingToday.length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximos
            </CardTitle>
            <Clock className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingAppointments.length > 0 
                ? `Próximo às ${format(parseISO(upcomingAppointments[0].start_time), "HH:mm")}`
                : "Nenhum agendamento"}
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Hoje
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ {todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Previsto: R$ {expectedRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sua Comissão ({commissionRate}%)
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">R$ {todayCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Previsto: R$ {expectedCommission.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card variant="elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Agenda de Hoje</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/my-schedule" className="flex items-center gap-1">
              Ver agenda completa
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
              <p className="text-sm text-muted-foreground">Aproveite para descansar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appointment) => {
                const isPast = !isAfter(parseISO(appointment.end_time), new Date());
                
                return (
                  <div
                    key={appointment.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border border-border",
                      isPast && appointment.status !== "completed" && "opacity-60",
                      appointment.status === "completed" && "bg-gold/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold text-gold">
                          {format(parseISO(appointment.start_time), "HH:mm")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(appointment.end_time), "HH:mm")}
                        </p>
                      </div>
                      
                      <div className="border-l border-border pl-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="font-medium text-foreground">
                            {appointment.client_name || "Cliente"}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {appointment.service?.name}
                        </p>
                        {appointment.client_phone && (
                          <p className="text-xs text-muted-foreground">{appointment.client_phone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={cn(statusColors[appointment.status])}>
                        {statusLabels[appointment.status]}
                      </Badge>
                      <p className="font-medium text-gold">
                        R$ {appointment.service?.price?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/dashboard/my-schedule">
          <Card variant="elevated" className="hover:border-gold/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" />
                Minha Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Veja todos os seus agendamentos e gerencie seu horário
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/my-commission">
          <Card variant="elevated" className="hover:border-gold/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gold" />
                Minhas Comissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Acompanhe seus ganhos e histórico de pagamentos
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
