import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCreateCommissionPayment, BarberCommissionSummary } from "@/hooks/useCommissionControl";

interface PayCommissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber: BarberCommissionSummary | null;
  periodStart: Date;
  periodEnd: Date;
}

const paymentMethods = [
  { value: "pix", label: "PIX" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
  { value: "outro", label: "Outro" },
];

export function PayCommissionDialog({
  open,
  onOpenChange,
  barber,
  periodStart,
  periodEnd,
}: PayCommissionDialogProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("pix");
  const [notes, setNotes] = useState("");

  const createPayment = useCreateCommissionPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barber) return;

    const paymentAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return;
    }

    await createPayment.mutateAsync({
      barber_id: barber.barber_id,
      period_start: periodStart,
      period_end: periodEnd,
      total_revenue: barber.total_revenue,
      commission_rate: barber.commission_rate,
      commission_amount: barber.commission_amount,
      amount_paid: paymentAmount,
      payment_method: method,
      notes: notes || undefined,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setAmount("");
    setMethod("pix");
    setNotes("");
  };

  const handlePayAll = () => {
    if (barber) {
      setAmount(barber.pending_amount.toFixed(2).replace(".", ","));
    }
  };

  const handlePayHalf = () => {
    if (barber) {
      setAmount((barber.pending_amount / 2).toFixed(2).replace(".", ","));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (!barber) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={barber.barber_avatar || undefined} />
              <AvatarFallback className="bg-gold/20 text-gold">
                {getInitials(barber.barber_name)}
              </AvatarFallback>
            </Avatar>
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Barbeiro:</span>
              <span className="font-medium">{barber.barber_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium">
                {format(periodStart, "dd/MM", { locale: ptBR })} -{" "}
                {format(periodEnd, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>

          <div className="border-t border-b py-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comissão Total:</span>
              <span className="font-medium">{formatCurrency(barber.commission_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Já Pago:</span>
              <span className="font-medium text-green-500">
                {formatCurrency(barber.amount_paid)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo Pendente:</span>
              <span className="font-bold text-gold">
                {formatCurrency(barber.pending_amount)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Pagamento</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePayAll}
                className="flex-1"
              >
                Pagar Tudo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePayHalf}
                className="flex-1"
              >
                Pagar Metade
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Método de Pagamento</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre o pagamento..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending ? "Registrando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
