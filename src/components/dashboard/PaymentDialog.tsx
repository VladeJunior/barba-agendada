import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard, ExternalLink, Tag, Check, X } from "lucide-react";
import { SubscriptionPlan } from "@/hooks/useSubscription";

// Valid coupons - can be moved to database later
const VALID_COUPONS: Record<string, { discountPercent: number; description: string }> = {
  BARBER20: { discountPercent: 20, description: "20% de desconto" },
};

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: SubscriptionPlan;
  planName: string;
  planPrice: number;
}

export function PaymentDialog({ open, onOpenChange, planId, planName, planPrice }: PaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const discountAmount = appliedCoupon ? (planPrice * appliedCoupon.discountPercent) / 100 : 0;
  const finalPrice = planPrice - discountAmount;

  // Reset coupon state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setCouponCode("");
      setAppliedCoupon(null);
      setCouponError(null);
    }
  }, [open]);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    setCouponError(null);

    if (!code) {
      setCouponError("Digite um código de cupom");
      return;
    }

    const coupon = VALID_COUPONS[code];
    if (coupon) {
      setAppliedCoupon({ code, discountPercent: coupon.discountPercent });
      setCouponError(null);
    } else {
      setCouponError("Cupom inválido ou expirado");
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-abacatepay-billing", {
        body: { planId, couponCode: appliedCoupon?.code || null },
      });

      if (error) throw error;

      const checkoutUrl = data?.url;
      
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("URL de pagamento não encontrada");
      }
    } catch (error) {
      console.error("Payment error:", error);

      let message = "Erro ao processar pagamento. Tente novamente.";

      // Try to surface the backend error message (e.g. missing phone/name)
      try {
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error && body?.details) message = `${body.error}: ${body.details}`;
          else if (body?.error) message = body.error;
        }
      } catch {
        // ignore parsing errors
      }

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            Assinar Plano {planName}
          </DialogTitle>
          <DialogDescription>
            Você será redirecionado para a página de pagamento segura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Coupon Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Cupom de desconto
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Cupom <span className="font-bold">{appliedCoupon.code}</span> aplicado!
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o código do cupom"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                >
                  Aplicar
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-sm text-destructive">{couponError}</p>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium text-foreground">{planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor mensal</span>
              <span className={`font-medium ${appliedCoupon ? "line-through text-muted-foreground" : "font-bold text-foreground text-lg"}`}>
                R$ {planPrice},00
              </span>
            </div>
            {appliedCoupon && (
              <>
                <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                  <span>Desconto ({appliedCoupon.discountPercent}%)</span>
                  <span>-R$ {discountAmount.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">Valor final</span>
                    <span className="font-bold text-foreground text-lg">
                      R$ {finalPrice.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Ao clicar em "Pagar agora", você será redirecionado para a página segura 
              de pagamento onde poderá pagar via PIX ou cartão de crédito de forma rápida e segura.
            </p>
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={isLoading}
            className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Pagar agora
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            🔒 Pagamento processado com segurança pela AbacatePay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}