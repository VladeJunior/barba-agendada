import { useState, useEffect } from "react";
import { useWorkingHours, useSaveWorkingHours, WorkingHourInput } from "@/hooks/useWorkingHours";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

interface WorkingHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barberId: string;
  barberName: string;
}

interface DaySchedule {
  is_active: boolean;
  start_time: string;
  end_time: string;
}

const defaultSchedule: Record<number, DaySchedule> = {
  0: { is_active: false, start_time: "09:00", end_time: "18:00" },
  1: { is_active: true, start_time: "09:00", end_time: "18:00" },
  2: { is_active: true, start_time: "09:00", end_time: "18:00" },
  3: { is_active: true, start_time: "09:00", end_time: "18:00" },
  4: { is_active: true, start_time: "09:00", end_time: "18:00" },
  5: { is_active: true, start_time: "09:00", end_time: "18:00" },
  6: { is_active: true, start_time: "09:00", end_time: "13:00" },
};

export function WorkingHoursDialog({ open, onOpenChange, barberId, barberName }: WorkingHoursDialogProps) {
  const { data: existingHours = [], isLoading } = useWorkingHours(barberId);
  const saveWorkingHours = useSaveWorkingHours();
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>({ ...defaultSchedule });

  useEffect(() => {
    if (existingHours.length > 0) {
      const newSchedule = { ...defaultSchedule };
      // First, set all days to inactive
      Object.keys(newSchedule).forEach(day => {
        newSchedule[parseInt(day)].is_active = false;
      });
      // Then, populate with existing data
      existingHours.forEach(hour => {
        newSchedule[hour.day_of_week] = {
          is_active: hour.is_active,
          start_time: hour.start_time.slice(0, 5),
          end_time: hour.end_time.slice(0, 5),
        };
      });
      setSchedule(newSchedule);
    }
  }, [existingHours]);

  const handleSave = async () => {
    const hours: WorkingHourInput[] = DAYS_OF_WEEK.map(day => ({
      barber_id: barberId,
      day_of_week: day.value,
      start_time: schedule[day.value].start_time,
      end_time: schedule[day.value].end_time,
      is_active: schedule[day.value].is_active,
    }));

    await saveWorkingHours.mutateAsync({ barberId, hours });
    onOpenChange(false);
  };

  const updateDay = (dayOfWeek: number, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...prev[dayOfWeek],
        [field]: value,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            Horários de Trabalho
          </DialogTitle>
          <DialogDescription>
            Configure os horários de trabalho de {barberName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {DAYS_OF_WEEK.map(day => (
              <div
                key={day.value}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  schedule[day.value].is_active
                    ? "bg-card border-gold/30"
                    : "bg-muted/30 border-border"
                }`}
              >
                <Switch
                  checked={schedule[day.value].is_active}
                  onCheckedChange={(checked) => updateDay(day.value, "is_active", checked)}
                />
                <span className="w-28 font-medium text-sm">{day.label}</span>
                
                {schedule[day.value].is_active && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={schedule[day.value].start_time}
                      onChange={(e) => updateDay(day.value, "start_time", e.target.value)}
                      className="w-24 h-8 text-sm"
                    />
                    <span className="text-muted-foreground text-sm">às</span>
                    <Input
                      type="time"
                      value={schedule[day.value].end_time}
                      onChange={(e) => updateDay(day.value, "end_time", e.target.value)}
                      className="w-24 h-8 text-sm"
                    />
                  </div>
                )}
                
                {!schedule[day.value].is_active && (
                  <span className="text-sm text-muted-foreground">Folga</span>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gold hover:bg-gold/90"
            disabled={saveWorkingHours.isPending}
          >
            {saveWorkingHours.isPending ? "Salvando..." : "Salvar Horários"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
