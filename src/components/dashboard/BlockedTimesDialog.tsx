import { useState } from "react";
import { format, addDays, setHours, setMinutes, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBlockedTimes, useCreateBlockedTime, useDeleteBlockedTime } from "@/hooks/useBlockedTimes";
import { cn } from "@/lib/utils";

interface BlockedTimesDialogProps {
  barberId: string;
  barberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minutes = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});

export function BlockedTimesDialog({ barberId, barberName, open, onOpenChange }: BlockedTimesDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);

  const { data: blockedTimes = [], isLoading } = useBlockedTimes(barberId);
  const createBlocked = useCreateBlockedTime();
  const deleteBlocked = useDeleteBlockedTime();

  const handleSubmit = async () => {
    if (!selectedDate) return;

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    let start: Date;
    let end: Date;

    if (isAllDay) {
      start = setMinutes(setHours(new Date(selectedDate), 0), 0);
      end = setMinutes(setHours(new Date(selectedDate), 23), 59);
    } else {
      start = setMinutes(setHours(new Date(selectedDate), startH), startM);
      end = setMinutes(setHours(new Date(selectedDate), endH), endM);
    }

    await createBlocked.mutateAsync({
      barber_id: barberId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      reason: reason.trim() || undefined,
    });

    setSelectedDate(undefined);
    setReason("");
    setIsAllDay(true);
  };

  const futureBlockedTimes = blockedTimes.filter(
    (bt) => new Date(bt.end_time) >= new Date()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Bloqueios de Horário
          </DialogTitle>
          <DialogDescription>
            Gerencie folgas e intervalos para {barberName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new block */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Bloqueio
            </h4>

            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    fromDate={new Date()}
                    toDate={addDays(new Date(), 90)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="allDay" className="text-sm cursor-pointer">
                Dia inteiro (folga)
              </Label>
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Consulta médica, Férias..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!selectedDate || createBlocked.isPending}
              className="w-full"
            >
              {createBlocked.isPending ? "Salvando..." : "Adicionar Bloqueio"}
            </Button>
          </div>

          {/* List existing blocks */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Bloqueios Ativos</h4>
            
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : futureBlockedTimes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum bloqueio agendado
              </p>
            ) : (
              <div className="space-y-2">
                {futureBlockedTimes.map((bt) => {
                  const start = parseISO(bt.start_time);
                  const end = parseISO(bt.end_time);
                  const isAllDayBlock =
                    start.getHours() === 0 && end.getHours() === 23;

                  return (
                    <div
                      key={bt.id}
                      className="flex items-center justify-between p-3 bg-card border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(start, "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {isAllDayBlock
                            ? "Dia inteiro"
                            : `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`}
                        </div>
                        {bt.reason && (
                          <p className="text-xs text-muted-foreground">
                            {bt.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBlocked.mutate(bt.id)}
                        disabled={deleteBlocked.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
