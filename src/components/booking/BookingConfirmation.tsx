import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, DollarSign, User, Scissors, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useValidateCoupon, LoyaltyCoupon } from "@/hooks/useLoyalty";

interface BookingConfirmationProps {
  shopId: string;
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
  onConfirm: (coupon?: LoyaltyCoupon) => void;
  isLoading: boolean;
}

export function BookingConfirmation({
  shopId,
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
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<LoyaltyCoupon | null>(null);
  const validateCoupon = useValidateCoupon(shopId);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const coupon = await validateCoupon.mutateAsync(couponCode);
      setAppliedCoupon(coupon);
      setCouponCode("");
    } catch (error) {
      // Error toast is handled by the mutation
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const calculateFinalPrice = () => {
    if (!appliedCoupon) return servicePrice;

    if (appliedCoupon.discount_percentage) {
      return servicePrice * (1 - appliedCoupon.discount_percentage / 100);
    }
    if (appliedCoupon.discount_amount) {
      return Math.max(0, servicePrice - appliedCoupon.discount_amount);
    }
    return servicePrice;
  };

  const finalPrice = calculateFinalPrice();
  const discount = servicePrice - finalPrice;

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
          
          {discount > 0 && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground line-through">
                <DollarSign className="h-4 w-4" />
                <span>R$ {servicePrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>R$ {finalPrice.toFixed(2)}</span>
                <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-600">
                  - R$ {discount.toFixed(2)}
                </Badge>
              </div>
            </>
          )}
          
          {discount === 0 && (
            <div className="flex items-center gap-2 text-primary font-semibold">
              <DollarSign className="h-4 w-4" />
              <span>R$ {servicePrice.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Cupom de desconto</h3>
        
        {appliedCoupon ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded">
                  <Ticket className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{appliedCoupon.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {appliedCoupon.discount_percentage
                      ? `${appliedCoupon.discount_percentage}% de desconto`
                      : `R$ ${Number(appliedCoupon.discount_amount).toFixed(2)} de desconto`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveCoupon}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código do cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              disabled={validateCoupon.isPending}
            />
            <Button
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || validateCoupon.isPending}
              variant="outline"
            >
              {validateCoupon.isPending ? "..." : "Aplicar"}
            </Button>
          </div>
        )}
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
        onClick={() => onConfirm(appliedCoupon || undefined)} 
        className="w-full" 
        size="lg"
        disabled={!isValid || isLoading}
      >
        {isLoading ? "Confirmando..." : "Confirmar Agendamento"}
      </Button>
    </div>
  );
}
