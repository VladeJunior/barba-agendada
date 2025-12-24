import { useState } from "react";
import { useAppointments, useCreateAppointment, useUpdateAppointment, useCancelAppointment, AppointmentInput } from "@/hooks/useAppointments";
import { useBarbers } from "@/hooks/useBarbers";
import { useServices } from "@/hooks/useServices";
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
import { Plus, CalendarIcon, ChevronLeft, ChevronRight, X, Check, Percent, Clock } from "lucide-react";
import { format, addMinutes, addDays, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CalendarGrid } from "@/components/schedule/CalendarGrid";

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

  const handleSlotClick = (barberId: string, time: string) => {
    const date = new Date(time);
    setFormData({
      barber_id: barberId,
      service_id: "",
      client_name: "",
      client_phone: "",
      date: date,
      time: format(date, "HH:mm"),
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
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

  const activeBarbers = barbers.filter(b => b.is_active);
  const activeServices = services.filter(s => s.is_active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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

      {/* Date Navigation */}
      <Card variant="elevated">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className={cn(
                  format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && "bg-gold/20 border-gold"
                )}
              >
                Hoje
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
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <CalendarGrid
        selectedDate={selectedDate}
        barbers={activeBarbers}
        appointments={appointments}
        onSlotClick={handleSlotClick}
        onAppointmentClick={handleAppointmentClick}
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

      {/* Appointment Details Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Agendamento</DialogTitle>
                <DialogDescription>
                  {format(parseISO(selectedAppointment.start_time), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">{selectedAppointment.client_name || "Cliente"}</span>
                </div>
                
                {selectedAppointment.client_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Telefone</span>
                    <span>{selectedAppointment.client_phone}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Barbeiro</span>
                  <span>{selectedAppointment.barber?.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Serviço</span>
                  <span>{selectedAppointment.service?.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {format(parseISO(selectedAppointment.start_time), "HH:mm")} - {format(parseISO(selectedAppointment.end_time), "HH:mm")}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor</span>
                  {selectedAppointment.discount_amount && selectedAppointment.discount_amount > 0 ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                        <Percent className="w-3 h-3 mr-1" />
                        -R$ {selectedAppointment.discount_amount.toFixed(2)}
                      </Badge>
                      <span className="font-medium text-gold">
                        R$ {selectedAppointment.final_price?.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <span className="font-medium text-gold">
                      R$ {selectedAppointment.service?.price?.toFixed(2)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={cn(statusColors[selectedAppointment.status as keyof typeof statusColors])}>
                    {statusLabels[selectedAppointment.status as keyof typeof statusLabels]}
                  </Badge>
                </div>

                {selectedAppointment.notes && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Observações:</span>
                    <p className="mt-1 text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {selectedAppointment.status === "scheduled" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => {
                        setCancelId(selectedAppointment.id);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(selectedAppointment.id, "confirmed")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar
                    </Button>
                  </>
                )}
                
                {selectedAppointment.status === "confirmed" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => {
                        setCancelId(selectedAppointment.id);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(selectedAppointment.id, "no_show")}
                    >
                      Não Compareceu
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(selectedAppointment.id, "completed")}
                      className="bg-gold hover:bg-gold/90"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Concluir
                    </Button>
                  </>
                )}
                
                {(selectedAppointment.status === "completed" || selectedAppointment.status === "no_show") && (
                  <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                    Fechar
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
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
