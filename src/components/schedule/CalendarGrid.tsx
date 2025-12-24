import { useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentBlock } from "./AppointmentBlock";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Barber {
  id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

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
  } | null;
}

interface CalendarGridProps {
  selectedDate: Date;
  barbers: Barber[];
  appointments: Appointment[];
  startHour?: number;
  endHour?: number;
  slotHeight?: number;
  onSlotClick?: (barberId: string, time: string) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
}

export function CalendarGrid({
  selectedDate,
  barbers,
  appointments,
  startHour = 8,
  endHour = 21,
  slotHeight = 48,
  onSlotClick,
  onAppointmentClick,
}: CalendarGridProps) {
  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    return slots;
  }, [startHour, endHour]);

  // Filter active barbers
  const activeBarbers = barbers.filter((b) => b.is_active);

  // Group appointments by barber
  const appointmentsByBarber = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    activeBarbers.forEach((barber) => {
      grouped[barber.id] = appointments.filter(
        (apt) =>
          apt.barber_id === barber.id &&
          apt.status !== "cancelled" &&
          isSameDay(parseISO(apt.start_time), selectedDate)
      );
    });
    return grouped;
  }, [appointments, activeBarbers, selectedDate]);

  const handleSlotClick = (barberId: string, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    onSlotClick?.(barberId, dateTime.toISOString());
  };

  if (activeBarbers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nenhum barbeiro ativo encontrado
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header with barber names */}
      <div className="flex border-b border-border bg-muted/30 sticky top-0 z-10">
        <div className="w-16 flex-shrink-0 border-r border-border" />
        {activeBarbers.map((barber) => (
          <div
            key={barber.id}
            className="flex-1 min-w-[140px] p-3 text-center border-r border-border last:border-r-0"
          >
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={barber.avatar_url || undefined} />
                <AvatarFallback className="bg-gold/20 text-gold text-sm">
                  {barber.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm text-foreground truncate max-w-full">
                {barber.name}
              </span>
            </div>
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

          {/* Barber columns */}
          {activeBarbers.map((barber) => (
            <div
              key={barber.id}
              className="flex-1 min-w-[140px] border-r border-border last:border-r-0 relative"
            >
              {/* Time slot cells */}
              {timeSlots.map((time, index) => (
                <div
                  key={time}
                  className={cn(
                    "border-b border-border/50 cursor-pointer transition-colors hover:bg-gold/5",
                    index % 2 === 0 ? "bg-background" : "bg-muted/10"
                  )}
                  style={{ height: `${slotHeight}px` }}
                  onClick={() => handleSlotClick(barber.id, time)}
                />
              ))}

              {/* Appointments overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="relative h-full pointer-events-auto">
                  {appointmentsByBarber[barber.id]?.map((appointment) => (
                    <AppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      slotHeight={slotHeight}
                      startHour={startHour}
                      onClick={onAppointmentClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
