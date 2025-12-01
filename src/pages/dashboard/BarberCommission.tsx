import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useBarbers } from "@/hooks/useBarbers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

export default function BarberCommission() {
  const { barberId, shopId } = useUserRole();
  const { data: barbers = [] } = useBarbers();
  
  const currentBarber = barbers.find(b => b.id === barberId);
  const commissionRate = currentBarber?.commission_rate ?? 0;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data: completedAppointments = [], isLoading } = useQuery({
    queryKey: ["barber-commission", barberId, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      if (!barberId || !shopId || !dateRange?.from || !dateRange?.to) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name, price, duration_minutes)
        `)
        .eq("barber_id", barberId)
        .eq("shop_id", shopId)
        .eq("status", "completed")
        .gte("start_time", dateRange.from.toISOString())
        .lte("start_time", dateRange.to.toISOString())
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!barberId && !!shopId && !!dateRange?.from && !!dateRange?.to,
  });

  const totalRevenue = completedAppointments.reduce(
    (sum, apt) => sum + (apt.service?.price || 0),
    0
  );
  
  const totalCommission = totalRevenue * (commissionRate / 100);
  const totalAppointments = completedAppointments.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Minha Comissão</h1>
        <p className="text-muted-foreground">
          Acompanhe seus ganhos • Taxa de comissão: {commissionRate}%
        </p>
      </div>

      {/* Date Range Picker */}
      <Card variant="elevated">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Período:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[280px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Selecione um período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Atendimentos Concluídos
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalAppointments}</div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Serviços
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              R$ {totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sua Comissão ({commissionRate}%)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">
              R$ {totalCommission.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Atendimentos do Período</CardTitle>
        </CardHeader>
        <CardContent>
          {completedAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum atendimento concluído no período selecionado
            </div>
          ) : (
            <div className="space-y-2">
              {completedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {format(parseISO(appointment.start_time), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                      <p className="text-muted-foreground">
                        {appointment.client_name || "Cliente"} • {appointment.service?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      R$ {appointment.service?.price?.toFixed(2)}
                    </p>
                    <p className="text-sm text-gold">
                      Comissão: R$ {((appointment.service?.price || 0) * (commissionRate / 100)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
