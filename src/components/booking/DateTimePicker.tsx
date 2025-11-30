import { useState, useMemo } from "react";
import { format, addDays, isSameDay, setHours, setMinutes, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useBarberWorkingHours, useBarberAppointments } from "@/hooks/usePublicShop";

interface DateTimePickerProps {
  barberId: string;
  serviceDuration: number;
  selectedDateTime: Date | null;
  onSelect: (dateTime: Date) => void;
}

export function DateTimePicker({ barberId, serviceDuration, selectedDateTime, onSelect }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(selectedDateTime || undefined);
  
  const { data: workingHours = [] } = useBarberWorkingHours(barberId);
  const { data: appointments = [] } = useBarberAppointments(barberId, selectedDate);

  const workingDays = useMemo(() => {
    return workingHours.map(wh => wh.day_of_week);
  }, [workingHours]);

  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(date, today)) return true;
    
    const dayOfWeek = date.getDay();
    return !workingDays.includes(dayOfWeek);
  };

  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
    
    if (!dayWorkingHours) return [];

    const slots: Date[] = [];
    const [startHour, startMin] = dayWorkingHours.start_time.split(':').map(Number);
    const [endHour, endMin] = dayWorkingHours.end_time.split(':').map(Number);

    let currentSlot = setMinutes(setHours(new Date(selectedDate), startHour), startMin);
    const endTime = setMinutes(setHours(new Date(selectedDate), endHour), endMin);
    const now = new Date();

    while (isBefore(currentSlot, endTime)) {
      const slotEnd = new Date(currentSlot.getTime() + serviceDuration * 60000);
      
      if (isAfter(currentSlot, now)) {
        const isAvailable = !appointments.some(apt => {
          const aptStart = new Date(apt.start_time);
          const aptEnd = new Date(apt.end_time);
          return (
            (currentSlot >= aptStart && currentSlot < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (currentSlot <= aptStart && slotEnd >= aptEnd)
          );
        });

        if (isAvailable) {
          slots.push(new Date(currentSlot));
        }
      }
      
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
    }

    return slots;
  }, [selectedDate, workingHours, appointments, serviceDuration]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (slot: Date) => {
    onSelect(slot);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3 text-foreground">Selecione a data</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={disabledDays}
          locale={ptBR}
          className="rounded-md border pointer-events-auto"
          fromDate={new Date()}
          toDate={addDays(new Date(), 30)}
        />
      </div>

      {selectedDate && (
        <div>
          <h3 className="font-medium mb-3 text-foreground">
            Horários disponíveis em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h3>
          {availableSlots.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum horário disponível nesta data. Selecione outra data.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {availableSlots.map((slot) => {
                const isSelected = selectedDateTime && isSameDay(slot, selectedDateTime) && 
                  slot.getHours() === selectedDateTime.getHours() && 
                  slot.getMinutes() === selectedDateTime.getMinutes();
                
                return (
                  <button
                    key={slot.toISOString()}
                    onClick={() => handleTimeSelect(slot)}
                    className={cn(
                      "py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    {format(slot, "HH:mm")}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
