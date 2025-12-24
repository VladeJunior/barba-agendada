import { useMemo, useState } from "react";
import { format, parseISO, isSameDay, isWithinInterval, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { AppointmentBlock } from "./AppointmentBlock";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Ban } from "lucide-react";

interface Barber {
  id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface BlockedTime {
  id: string;
  barber_id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
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
    duration_minutes?: number;
  } | null;
}

interface CalendarGridProps {
  selectedDate: Date;
  barbers: Barber[];
  appointments: Appointment[];
  blockedTimes?: BlockedTime[];
  startHour?: number;
  endHour?: number;
  slotHeight?: number;
  onSlotClick?: (barberId: string, time: string) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAppointmentDrop?: (appointmentId: string, barberId: string, newStartTime: Date) => void;
}

export function CalendarGrid({
  selectedDate,
  barbers,
  appointments,
  blockedTimes = [],
  startHour = 8,
  endHour = 21,
  slotHeight = 48,
  onSlotClick,
  onAppointmentClick,
  onAppointmentDrop,
}: CalendarGridProps) {
  const [draggingAppointment, setDraggingAppointment] = useState<Appointment | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ barberId: string; time: string } | null>(null);

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

  // Group blocked times by barber
  const blockedByBarber = useMemo(() => {
    const grouped: Record<string, BlockedTime[]> = {};
    activeBarbers.forEach((barber) => {
      grouped[barber.id] = blockedTimes.filter(
        (bt) =>
          bt.barber_id === barber.id &&
          isSameDay(parseISO(bt.start_time), selectedDate)
      );
    });
    return grouped;
  }, [blockedTimes, activeBarbers, selectedDate]);

  // Calculate occupancy per barber
  const occupancyByBarber = useMemo(() => {
    const totalSlots = timeSlots.length;
    const occupancy: Record<string, { booked: number; blocked: number; percentage: number }> = {};

    activeBarbers.forEach((barber) => {
      const barberAppointments = appointmentsByBarber[barber.id] || [];
      const barberBlocked = blockedByBarber[barber.id] || [];

      let bookedSlots = 0;
      let blockedSlots = 0;

      // Count booked slots
      barberAppointments.forEach((apt) => {
        const duration = differenceInMinutes(parseISO(apt.end_time), parseISO(apt.start_time));
        bookedSlots += duration / 30;
      });

      // Count blocked slots
      barberBlocked.forEach((bt) => {
        const duration = differenceInMinutes(parseISO(bt.end_time), parseISO(bt.start_time));
        blockedSlots += duration / 30;
      });

      const totalOccupied = bookedSlots + blockedSlots;
      occupancy[barber.id] = {
        booked: Math.round((bookedSlots / totalSlots) * 100),
        blocked: Math.round((blockedSlots / totalSlots) * 100),
        percentage: Math.min(100, Math.round((totalOccupied / totalSlots) * 100)),
      };
    });

    return occupancy;
  }, [appointmentsByBarber, blockedByBarber, timeSlots.length, activeBarbers]);

  // Check if a slot is blocked
  const isSlotBlocked = (barberId: string, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    const barberBlocked = blockedByBarber[barberId] || [];
    return barberBlocked.some((bt) => {
      const blockStart = parseISO(bt.start_time);
      const blockEnd = parseISO(bt.end_time);
      return (
        isWithinInterval(slotTime, { start: blockStart, end: blockEnd }) ||
        isWithinInterval(slotEnd, { start: blockStart, end: blockEnd }) ||
        (slotTime <= blockStart && slotEnd >= blockEnd)
      );
    });
  };

  // Get blocked time info for a slot
  const getBlockedInfo = (barberId: string, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hours, minutes, 0, 0);

    const barberBlocked = blockedByBarber[barberId] || [];
    return barberBlocked.find((bt) => {
      const blockStart = parseISO(bt.start_time);
      const blockEnd = parseISO(bt.end_time);
      return slotTime >= blockStart && slotTime < blockEnd;
    });
  };

  const handleSlotClick = (barberId: string, time: string) => {
    if (isSlotBlocked(barberId, time)) return;
    
    const [hours, minutes] = time.split(":").map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    onSlotClick?.(barberId, dateTime.toISOString());
  };

  const handleDragOver = (e: React.DragEvent, barberId: string, time: string) => {
    if (isSlotBlocked(barberId, time)) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot({ barberId, time });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, barberId: string, time: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    setDraggingAppointment(null);

    if (isSlotBlocked(barberId, time)) return;

    try {
      const appointment = JSON.parse(e.dataTransfer.getData("application/json")) as Appointment;
      const [hours, minutes] = time.split(":").map(Number);
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(hours, minutes, 0, 0);

      onAppointmentDrop?.(appointment.id, barberId, newStartTime);
    } catch (error) {
      console.error("Error parsing drag data:", error);
    }
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
      {/* Header with barber names and occupancy */}
      <div className="flex border-b border-border bg-muted/30 sticky top-0 z-10">
        <div className="w-16 flex-shrink-0 border-r border-border" />
        {activeBarbers.map((barber) => {
          const occupancy = occupancyByBarber[barber.id] || { booked: 0, blocked: 0, percentage: 0 };
          return (
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
                
                {/* Occupancy indicator */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full max-w-[100px]">
                        <Progress 
                          value={occupancy.percentage} 
                          className="h-1.5"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {occupancy.percentage}% ocupado
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Agendado: {occupancy.booked}%
                        </p>
                        {occupancy.blocked > 0 && (
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-500" />
                            Bloqueado: {occupancy.blocked}%
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          Disponível: {100 - occupancy.percentage}%
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
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
              {timeSlots.map((time, index) => {
                const blocked = isSlotBlocked(barber.id, time);
                const blockedInfo = blocked ? getBlockedInfo(barber.id, time) : null;
                const isDragOver = dragOverSlot?.barberId === barber.id && dragOverSlot?.time === time;

                return (
                  <TooltipProvider key={time}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "border-b border-border/50 transition-colors",
                            index % 2 === 0 ? "bg-background" : "bg-muted/10",
                            blocked 
                              ? "bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,hsl(var(--muted)/0.5)_4px,hsl(var(--muted)/0.5)_8px)] cursor-not-allowed" 
                              : "cursor-pointer hover:bg-gold/5",
                            isDragOver && !blocked && "bg-gold/20 ring-2 ring-gold ring-inset"
                          )}
                          style={{ height: `${slotHeight}px` }}
                          onClick={() => handleSlotClick(barber.id, time)}
                          onDragOver={(e) => handleDragOver(e, barber.id, time)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, barber.id, time)}
                        >
                          {blocked && blockedInfo && index % 2 === 0 && (
                            <div className="flex items-center justify-center h-full">
                              <Ban className="w-3 h-3 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      {blocked && blockedInfo && (
                        <TooltipContent>
                          <p className="font-medium">Horário bloqueado</p>
                          {blockedInfo.reason && (
                            <p className="text-sm text-muted-foreground">{blockedInfo.reason}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(blockedInfo.start_time), "HH:mm")} - {format(parseISO(blockedInfo.end_time), "HH:mm")}
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}

              {/* Appointments overlay */}
              {appointmentsByBarber[barber.id]?.map((appointment) => (
                <AppointmentBlock
                  key={appointment.id}
                  appointment={appointment}
                  slotHeight={slotHeight}
                  startHour={startHour}
                  onClick={onAppointmentClick}
                  onDragStart={setDraggingAppointment}
                  isDragging={draggingAppointment?.id === appointment.id}
                />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
