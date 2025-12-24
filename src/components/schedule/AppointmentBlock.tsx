import { cn } from "@/lib/utils";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Appointment {
  id: string;
  client_name: string | null;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  service?: {
    name: string;
    price: number;
  } | null;
}

interface AppointmentBlockProps {
  appointment: Appointment;
  slotHeight: number;
  startHour: number;
  onClick?: (appointment: Appointment) => void;
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

export function AppointmentBlock({ appointment, slotHeight, startHour, onClick }: AppointmentBlockProps) {
  const start = parseISO(appointment.start_time);
  const end = parseISO(appointment.end_time);
  
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const baseMinutes = startHour * 60;
  const topOffset = ((startMinutes - baseMinutes) / 30) * slotHeight;
  
  const duration = differenceInMinutes(end, start);
  const height = (duration / 30) * slotHeight;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 cursor-pointer transition-colors overflow-hidden",
              statusColors[appointment.status]
            )}
            style={{
              top: `${topOffset}px`,
              height: `${Math.max(height - 2, slotHeight - 2)}px`,
              minHeight: `${slotHeight - 2}px`,
            }}
            onClick={() => onClick?.(appointment)}
          >
            <p className="text-xs font-medium text-white truncate">
              {format(start, "HH:mm")} - {appointment.client_name || "Cliente"}
            </p>
            {height > slotHeight && (
              <p className="text-xs text-white/80 truncate">
                {appointment.service?.name}
              </p>
            )}
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
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
