import { useState, useEffect } from "react";
import { useAppointments, useUpdateAppointment } from "@/hooks/useAppointments";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

export default function BarberSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { barberId } = useUserRole();
  const { data: appointments = [], isLoading } = useAppointments(selectedDate);
  const updateAppointment = useUpdateAppointment();

  // Filter appointments for this barber only
  const myAppointments = appointments.filter(
    (a) => a.barber_id === barberId && a.status !== "cancelled"
  );

  const handleStatusChange = async (id: string, status: string) => {
    await updateAppointment.mutateAsync({ id, status: status as any });
  };

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
        <h1 className="text-2xl font-display font-bold text-foreground">Minha Agenda</h1>
        <p className="text-muted-foreground">Visualize seus agendamentos do dia</p>
      </div>

      {/* Date Navigation */}
      <Card variant="elevated">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      {myAppointments.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myAppointments.map((appointment) => (
            <Card key={appointment.id} variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
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
                      <p className="font-medium text-foreground">
                        {appointment.client_name || "Cliente"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.service?.name}
                      </p>
                      {appointment.client_phone && (
                        <p className="text-xs text-muted-foreground">{appointment.client_phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={cn(statusColors[appointment.status])}>
                      {statusLabels[appointment.status]}
                    </Badge>
                    
                    <p className="font-medium text-gold ml-2">
                      R$ {appointment.service?.price?.toFixed(2)}
                    </p>

                    {appointment.status === "scheduled" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStatusChange(appointment.id, "confirmed")}
                        title="Confirmar"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
