import { useState } from "react";
import { useAppointments, useWeekAppointments, useCreateAppointment, useUpdateAppointment, useCancelAppointment, AppointmentInput } from "@/hooks/useAppointments";
import { useBarbers } from "@/hooks/useBarbers";
import { useServices } from "@/hooks/useServices";
import { useBlockedTimes } from "@/hooks/useBlockedTimes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, CalendarIcon, ChevronLeft, ChevronRight, Users, CalendarDays } from "lucide-react";
import { format, addMinutes, addDays, subDays, addWeeks, subWeeks, startOfWeek, endOfWeek, differenceInMinutes, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarGrid } from "@/components/schedule/CalendarGrid";
import { WeekGrid } from "@/components/schedule/WeekGrid";
import { AppointmentDetailsDialog } from "@/components/schedule/AppointmentDetailsDialog";
import { toast } from "sonner";

type ViewMode = "barbers" | "week";

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("barbers");
  
  const { data: dayAppointments = [], isLoading: isLoadingDay } = useAppointments(selectedDate);
  const { data: weekAppointments = [], isLoading: isLoadingWeek } = useWeekAppointments(selectedDate);
  const { data: blockedTimes = [] } = useBlockedTimes();
  
  const { data: barbers = [] } = useBarbers();
  const { data: services = [] } = useServices();
  
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const cancelAppointment = useCancelAppointment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const [formData, setFormData] = useState({
    barber_id: "",
    service_id: "",
    client_name: "",
    client_phone: "",
    date: new Date(),
    time: "09:00",
    notes: "",
  });

  const appointments = viewMode === "barbers" ? dayAppointments : weekAppointments;
  const isLoading = viewMode === "barbers" ? isLoadingDay : isLoadingWeek;

  const resetForm = () => {
    setFormData({
      barber_id: "",
      service_id: "",
      client_name: "",
      client_phone: "",
      date: selectedDate,
      time: "09:00",
      notes: "",
    });
  };

  const handleSlotClick = (barberIdOrDate: string | Date, time: string) => {
    const date = new Date(time);
    
    if (viewMode === "barbers" && typeof barberIdOrDate === "string") {
      setFormData({
        barber_id: barberIdOrDate,
        service_id: "",
        client_name: "",
        client_phone: "",
        date: date,
        time: format(date, "HH:mm"),
        notes: "",
      });
    } else {
      setFormData({
        barber_id: "",
        service_id: "",
        client_name: "",
        client_phone: "",
        date: date,
        time: format(date, "HH:mm"),
        notes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
  };

  const handleAppointmentDrop = async (appointmentId: string, barberId: string, newStartTime: Date) => {
    // Find the original appointment to get its duration
    const originalAppointment = appointments.find(a => a.id === appointmentId);
    if (!originalAppointment) return;

    const originalStart = parseISO(originalAppointment.start_time);
    const originalEnd = parseISO(originalAppointment.end_time);
    const duration = differenceInMinutes(originalEnd, originalStart);
    
    const newEndTime = addMinutes(newStartTime, duration);

    try {
      await updateAppointment.mutateAsync({
        id: appointmentId,
        barber_id: barberId,
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
      });
      toast.success("Agendamento reagendado com sucesso!");
    } catch (error) {
      toast.error("Erro ao reagendar agendamento");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const service = services.find(s => s.id === formData.service_id);
    if (!service) return;

    const [hours, minutes] = formData.time.split(":").map(Number);
    const startTime = new Date(formData.date);
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = addMinutes(startTime, service.duration_minutes);

    const input: AppointmentInput = {
      barber_id: formData.barber_id,
      service_id: formData.service_id,
      client_name: formData.client_name,
      client_phone: formData.client_phone,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      notes: formData.notes || undefined,
    };

    await createAppointment.mutateAsync(input);
    setIsModalOpen(false);
    resetForm();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateAppointment.mutateAsync({ id, status: status as AppointmentInput["status"] });
    setSelectedAppointment(null);
  };

  const handleCancel = async () => {
    if (cancelId) {
      await cancelAppointment.mutateAsync(cancelId);
      setCancelId(null);
      setSelectedAppointment(null);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "barbers") {
      setSelectedDate(direction === "prev" ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
    } else {
      setSelectedDate(direction === "prev" ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1));
    }
  };

  const activeBarbers = barbers.filter(b => b.is_active);
  const activeServices = services.filter(s => s.is_active);

  const getDateLabel = () => {
    if (viewMode === "barbers") {
      return format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    }
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    return `${format(start, "d MMM", { locale: ptBR })} - ${format(end, "d MMM yyyy", { locale: ptBR })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da sua barbearia</p>
        </div>
        
        <Button 
          onClick={() => {
            resetForm();
            setFormData(prev => ({ ...prev, date: selectedDate }));
            setIsModalOpen(true);
          }}
          className="bg-gold hover:bg-gold/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Navigation and View Toggle */}
      <Card variant="elevated">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="barbers" className="gap-2 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Por Barbeiro</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-2 data-[state=active]:bg-gold/20 data-[state=active]:text-gold">
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">Semanal</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className={cn(
                  "hidden sm:flex",
                  format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && "bg-gold/20 border-gold"
                )}
              >
                Hoje
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[180px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">{getDateLabel()}</span>
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
              
              <Button variant="ghost" size="icon" onClick={() => navigateDate("next")}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === "barbers" ? (
        <CalendarGrid
          selectedDate={selectedDate}
          barbers={activeBarbers}
          appointments={appointments}
          blockedTimes={blockedTimes}
          onSlotClick={handleSlotClick}
          onAppointmentClick={handleAppointmentClick}
          onAppointmentDrop={handleAppointmentDrop}
        />
      ) : (
        <WeekGrid
          selectedDate={selectedDate}
          appointments={appointments}
          onSlotClick={(date, time) => handleSlotClick(date, time)}
          onAppointmentClick={handleAppointmentClick}
        />
      )}

      {/* Appointment Details Modal */}
      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        onConfirm={(id) => handleStatusChange(id, "confirmed")}
        onComplete={(id) => handleStatusChange(id, "completed")}
        onNoShow={(id) => handleStatusChange(id, "no_show")}
        onCancel={(id) => setCancelId(id)}
      />

      {/* New Appointment Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>
                Agende um horário para um cliente
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label>Barbeiro</Label>
                <Select
                  value={formData.barber_id}
                  onValueChange={(value) => setFormData({ ...formData, barber_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBarbers.map((barber) => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) => setFormData({ ...formData, service_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price.toFixed(2)} ({service.duration_minutes}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.date, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData({ ...formData, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre o agendamento..."
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gold hover:bg-gold/90"
                disabled={createAppointment.isPending}
              >
                Agendar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O cliente será notificado sobre o cancelamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive hover:bg-destructive/90"
            >
              Cancelar Agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
