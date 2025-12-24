import { format, parseISO, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, X, Check, Phone, User, Scissors, Calendar, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  barber_id: string;
  client_name: string | null;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes?: string | null;
  discount_amount?: number | null;
  final_price?: number | null;
  barber?: {
    name: string;
  } | null;
  service?: {
    name: string;
    price: number;
    duration_minutes?: number;
  } | null;
}

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
  onNoShow?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const statusConfig = {
  scheduled: { label: "Agendado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  confirmed: { label: "Confirmado", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  completed: { label: "Concluído", color: "bg-gold/20 text-gold border-gold/30" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  no_show: { label: "Não compareceu", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

export function AppointmentDetailsDialog({
  appointment,
  open,
  onOpenChange,
  onConfirm,
  onComplete,
  onNoShow,
  onCancel,
}: AppointmentDetailsDialogProps) {
  if (!appointment) return null;

  const start = parseISO(appointment.start_time);
  const end = parseISO(appointment.end_time);
  const duration = differenceInMinutes(end, start);
  const price = appointment.final_price ?? appointment.service?.price ?? 0;
  const hasDiscount = appointment.discount_amount && appointment.discount_amount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold">Detalhes do Agendamento</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(start, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </DialogHeader>
        
        <div className="px-6 space-y-4">
          {/* Client */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Cliente
            </span>
            <span className="font-medium text-right">
              {appointment.client_name || "Cliente"}
            </span>
          </div>
          
          <Separator className="bg-border/50" />
          
          {/* Phone */}
          {appointment.client_phone && (
            <>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </span>
                <a 
                  href={`tel:${appointment.client_phone}`}
                  className="font-medium text-right hover:text-gold transition-colors"
                >
                  {appointment.client_phone}
                </a>
              </div>
              <Separator className="bg-border/50" />
            </>
          )}
          
          {/* Barber */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Barbeiro
            </span>
            <span className="font-medium text-right">
              {appointment.barber?.name || "—"}
            </span>
          </div>
          
          <Separator className="bg-border/50" />
          
          {/* Service */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Serviço
            </span>
            <span className="font-medium text-right">
              {appointment.service?.name || "—"}
            </span>
          </div>
          
          <Separator className="bg-border/50" />
          
          {/* Time */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horário
            </span>
            <span className="font-medium flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {format(start, "HH:mm")} - {format(end, "HH:mm")}
              <span className="text-xs text-muted-foreground ml-1">({duration}min)</span>
            </span>
          </div>
          
          <Separator className="bg-border/50" />
          
          {/* Price */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Valor
            </span>
            <div className="flex items-center gap-2">
              {hasDiscount && (
                <span className="text-xs line-through text-muted-foreground">
                  R$ {appointment.service?.price?.toFixed(2)}
                </span>
              )}
              <span className="font-semibold text-gold text-lg">
                R$ {price.toFixed(2)}
              </span>
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          {/* Status */}
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Status</span>
            <Badge 
              variant="outline" 
              className={cn("font-medium", statusConfig[appointment.status].color)}
            >
              {statusConfig[appointment.status].label}
            </Badge>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <>
              <Separator className="bg-border/50" />
              <div className="py-2">
                <span className="text-sm text-muted-foreground">Observações:</span>
                <p className="mt-1 text-sm bg-muted/30 rounded-md p-3">
                  {appointment.notes}
                </p>
              </div>
            </>
          )}
        </div>
        
        {/* Actions */}
        <div className="p-6 pt-4 mt-2 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2">
            {appointment.status === "scheduled" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => onCancel?.(appointment.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => onConfirm?.(appointment.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Confirmar
                </Button>
              </>
            )}
            
            {appointment.status === "confirmed" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                  onClick={() => onCancel?.(appointment.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => onNoShow?.(appointment.id)}
                >
                  Não Compareceu
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-gold hover:bg-gold/90 text-primary-foreground"
                  onClick={() => onComplete?.(appointment.id)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Concluir
                </Button>
              </>
            )}
            
            {(appointment.status === "completed" || appointment.status === "no_show" || appointment.status === "cancelled") && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
