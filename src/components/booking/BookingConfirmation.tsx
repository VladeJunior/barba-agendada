import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, DollarSign, User, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BookingConfirmationProps {
  shopName: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  barberName: string;
  dateTime: Date;
  clientName: string;
  clientPhone: string;
  notes: string;
  onClientNameChange: (value: string) => void;
  onClientPhoneChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function BookingConfirmation({
  shopName,
  serviceName,
  servicePrice,
  serviceDuration,
  barberName,
  dateTime,
  clientName,
  clientPhone,
  notes,
  onClientNameChange,
  onClientPhoneChange,
  onNotesChange,
  onConfirm,
  isLoading,
}: BookingConfirmationProps) {
  const isValid = clientName.trim().length >= 2 && clientPhone.trim().length >= 10;

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-lg text-foreground">Resumo do Agendamento</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scissors className="h-4 w-4" />
            <span>{shopName}</span>
          </div>
          
          <div className="flex items-center gap-2 text-foreground">
            <span className="font-medium">{serviceName}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>com {barberName}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(dateTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(dateTime, "HH:mm")} ({serviceDuration} min)</span>
          </div>
          
          <div className="flex items-center gap-2 text-primary font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>R$ {servicePrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Seus dados</h3>
        
        <div className="space-y-2">
          <Label htmlFor="clientName">Nome completo *</Label>
          <Input
            id="clientName"
            placeholder="Digite seu nome"
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="clientPhone">Telefone / WhatsApp *</Label>
          <Input
            id="clientPhone"
            placeholder="(11) 99999-9999"
            value={clientPhone}
            onChange={(e) => onClientPhoneChange(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Observações (opcional)</Label>
          <Textarea
            id="notes"
            placeholder="Alguma observação para o barbeiro?"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <Button 
        onClick={onConfirm} 
        className="w-full" 
        size="lg"
        disabled={!isValid || isLoading}
      >
        {isLoading ? "Confirmando..." : "Confirmar Agendamento"}
      </Button>
    </div>
  );
}
