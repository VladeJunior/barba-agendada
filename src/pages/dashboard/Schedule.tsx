import { useState } from "react";
import { useAppointments, useCreateAppointment, useUpdateAppointment, useCancelAppointment, AppointmentInput } from "@/hooks/useAppointments";
import { useBarbers } from "@/hooks/useBarbers";
import { useServices } from "@/hooks/useServices";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check, Percent } from "lucide-react";
import { format, addMinutes, addDays, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: appointments = [], isLoading } = useAppointments(selectedDate);
  const { data: barbers = [] } = useBarbers();
  const { data: services = [] } = useServices();
  
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const cancelAppointment = useCancelAppointment();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    barber_id: "",
    service_id: "",
    client_name: "",
    client_phone: "",
    date: new Date(),
    time: "09:00",
    notes: "",
  });

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
  };

  const handleCancel = async () => {
    if (cancelId) {
      await cancelAppointment.mutateAsync(cancelId);
      setCancelId(null);
    }
  };

  const activeBarbers = barbers.filter(b => b.is_active);
  const activeServices = services.filter(s => s.is_active);

  const filteredAppointments = appointments.filter(a => a.status !== "cancelled");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da sua barbearia</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
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
      {filteredAppointments.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
            <p className="text-sm text-muted-foreground">Clique em "Novo Agendamento" para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => (
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
                        {appointment.service?.name} • {appointment.barber?.name}
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
                    
                    {appointment.discount_amount && appointment.discount_amount > 0 ? (
                      <div className="flex items-center gap-1 ml-2">
                        <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                          <Percent className="w-3 h-3 mr-1" />
                          -R$ {appointment.discount_amount.toFixed(2)}
                        </Badge>
                        <p className="font-medium text-gold">
                          R$ {appointment.final_price?.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <p className="font-medium text-gold ml-2">
                        R$ {appointment.service?.price?.toFixed(2)}
                      </p>
                    )}

                    {appointment.status === "scheduled" && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStatusChange(appointment.id, "confirmed")}
                          title="Confirmar"
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCancelId(appointment.id)}
                          title="Cancelar"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                    
                    {appointment.status === "confirmed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(appointment.id, "completed")}
                        className="ml-2"
                      >
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
