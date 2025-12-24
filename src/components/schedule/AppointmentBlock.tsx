import { cn } from "@/lib/utils";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical } from "lucide-react";

interface Appointment {
  id: string;
  barber_id: string;
  client_name: string | null;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  service?: {
    name: string;
    price: number;
    duration_minutes?: number;
  } | null;
}

interface AppointmentBlockProps {
  appointment: Appointment;
  slotHeight: number;
  startHour: number;
  onClick?: (appointment: Appointment) => void;
  onDragStart?: (appointment: Appointment) => void;
  isDragging?: boolean;
}

const statusColors = {
  scheduled: "bg-blue-500/80 border-blue-400 hover:bg-blue-500",
  confirmed: "bg-green-500/80 border-green-400 hover:bg-green-500",
  completed: "bg-gold/80 border-gold hover:bg-gold",
  cancelled: "bg-red-500/80 border-red-400 hover:bg-red-500",
  no_show: "bg-gray-500/80 border-gray-400 hover:bg-gray-500",
};

const statusLabels = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export function AppointmentBlock({ 
  appointment, 
  slotHeight, 
  startHour, 
  onClick,
  onDragStart,
  isDragging 
}: AppointmentBlockProps) {
  const start = parseISO(appointment.start_time);
  const end = parseISO(appointment.end_time);
  
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const baseMinutes = startHour * 60;
  const topOffset = ((startMinutes - baseMinutes) / 30) * slotHeight;
  
  const duration = differenceInMinutes(end, start);
  const height = (duration / 30) * slotHeight;

  const canDrag = appointment.status === "scheduled" || appointment.status === "confirmed";

  const handleDragStart = (e: React.DragEvent) => {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("application/json", JSON.stringify(appointment));
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(appointment);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable={canDrag}
            onDragStart={handleDragStart}
            className={cn(
              "absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 cursor-pointer transition-all overflow-hidden group",
              statusColors[appointment.status],
              isDragging && "opacity-50 scale-95",
              canDrag && "cursor-grab active:cursor-grabbing"
            )}
            style={{
              top: `${topOffset}px`,
              height: `${Math.max(height - 2, slotHeight - 2)}px`,
              minHeight: `${slotHeight - 2}px`,
            }}
            onClick={() => onClick?.(appointment)}
          >
            <div className="flex items-start gap-1">
              {canDrag && (
                <GripVertical className="w-3 h-3 text-white/60 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {format(start, "HH:mm")} - {appointment.client_name || "Cliente"}
                </p>
                {height > slotHeight && (
                  <p className="text-xs text-white/80 truncate">
                    {appointment.service?.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{appointment.client_name || "Cliente"}</p>
            <p className="text-sm text-muted-foreground">
              {format(start, "HH:mm")} - {format(end, "HH:mm")}
            </p>
            <p className="text-sm">{appointment.service?.name}</p>
            {appointment.service?.price && (
              <p className="text-sm font-medium text-gold">
                R$ {appointment.service.price.toFixed(2)}
              </p>
            )}
            {appointment.client_phone && (
              <p className="text-xs text-muted-foreground">{appointment.client_phone}</p>
            )}
            <p className="text-xs">Status: {statusLabels[appointment.status]}</p>
            {canDrag && (
              <p className="text-xs text-muted-foreground italic">Arraste para reagendar</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
