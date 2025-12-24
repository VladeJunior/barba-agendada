import { useMemo } from "react";
import { format, parseISO, isSameDay, startOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Appointment {
  id: string;
  barber_id: string;
  client_name: string | null;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  barber?: {
    name: string;
  } | null;
  service?: {
    name: string;
    price: number;
  } | null;
}

interface WeekGridProps {
  selectedDate: Date;
  appointments: Appointment[];
  startHour?: number;
  endHour?: number;
  slotHeight?: number;
  onSlotClick?: (date: Date, time: string) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
}

const statusColors = {
  scheduled: "bg-blue-500/80 border-blue-400",
  confirmed: "bg-green-500/80 border-green-400",
  completed: "bg-gold/80 border-gold",
  cancelled: "bg-red-500/80 border-red-400",
  no_show: "bg-gray-500/80 border-gray-400",
};

export function WeekGrid({
  selectedDate,
  appointments,
  startHour = 8,
  endHour = 21,
  slotHeight = 40,
  onSlotClick,
  onAppointmentClick,
}: WeekGridProps) {
  // Generate week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }, [startHour, endHour]);

  // Group appointments by day
  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      grouped[dayKey] = appointments.filter(
        (apt) =>
          apt.status !== "cancelled" &&
          isSameDay(parseISO(apt.start_time), day)
      );
    });
    return grouped;
  }, [appointments, weekDays]);

  const handleSlotClick = (day: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const dateTime = new Date(day);
    dateTime.setHours(hours, minutes, 0, 0);
    onSlotClick?.(day, dateTime.toISOString());
  };

  const getAppointmentPosition = (appointment: Appointment) => {
    const start = parseISO(appointment.start_time);
    const end = parseISO(appointment.end_time);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const baseMinutes = startHour * 60;
    
    const topOffset = ((startMinutes - baseMinutes) / 30) * slotHeight;
    const height = ((endMinutes - startMinutes) / 30) * slotHeight;

    return { top: topOffset, height: Math.max(height - 2, slotHeight - 2) };
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isSelected = (date: Date) => isSameDay(date, selectedDate);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header with weekdays */}
      <div className="flex border-b border-border bg-muted/30 sticky top-0 z-10">
        <div className="w-16 flex-shrink-0 border-r border-border" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "flex-1 min-w-[100px] p-2 text-center border-r border-border last:border-r-0",
              isToday(day) && "bg-gold/10",
              isSelected(day) && "bg-primary/10"
            )}
          >
            <p className={cn(
              "text-xs uppercase font-medium",
              isToday(day) ? "text-gold" : "text-muted-foreground"
            )}>
              {format(day, "EEE", { locale: ptBR })}
            </p>
            <p className={cn(
              "text-lg font-bold mt-1",
              isToday(day) ? "text-gold" : "text-foreground"
            )}>
              {format(day, "d")}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
        <div className="flex">
          {/* Time column */}
          <div className="w-16 flex-shrink-0 border-r border-border">
            {timeSlots.map((time, index) => (
              <div
                key={time}
                className={cn(
                  "flex items-start justify-end pr-2 text-xs text-muted-foreground border-b border-border/50",
                  index % 2 === 0 ? "font-medium" : "text-muted-foreground/60"
                )}
                style={{ height: `${slotHeight}px` }}
              >
                <span className="-mt-2">{index % 2 === 0 ? time : ""}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayAppointments = appointmentsByDay[dayKey] || [];

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 min-w-[100px] border-r border-border last:border-r-0 relative",
                  isToday(day) && "bg-gold/5"
                )}
              >
                {/* Time slot cells */}
                {timeSlots.map((time, index) => (
                  <div
                    key={time}
                    className={cn(
                      "border-b border-border/50 cursor-pointer transition-colors hover:bg-gold/10",
                      index % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                    )}
                    style={{ height: `${slotHeight}px` }}
                    onClick={() => handleSlotClick(day, time)}
                  />
                ))}

                {/* Appointments overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="relative h-full">
                    {dayAppointments.map((appointment) => {
                      const { top, height } = getAppointmentPosition(appointment);
                      return (
                        <div
                          key={appointment.id}
                          className={cn(
                            "absolute left-0.5 right-0.5 rounded border-l-2 px-1 py-0.5 cursor-pointer pointer-events-auto transition-opacity hover:opacity-90 overflow-hidden",
                            statusColors[appointment.status]
                          )}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          onClick={() => onAppointmentClick?.(appointment)}
                        >
                          <p className="text-[10px] font-medium text-white truncate leading-tight">
                            {format(parseISO(appointment.start_time), "HH:mm")}
                          </p>
                          <p className="text-[9px] text-white/80 truncate leading-tight">
                            {appointment.client_name || "Cliente"}
                          </p>
                          {height > slotHeight && (
                            <p className="text-[9px] text-white/60 truncate leading-tight">
                              {appointment.barber?.name}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
