import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard, ExternalLink } from "lucide-react";
import { SubscriptionPlan } from "@/hooks/useSubscription";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: SubscriptionPlan;
  planName: string;
  planPrice: number;
}

export function PaymentDialog({ open, onOpenChange, planId, planName, planPrice }: PaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-abacatepay-billing", {
        body: { planId },
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
      toast.error("Erro ao processar pagamento. Tente novamente.");
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
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium text-foreground">{planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Valor mensal</span>
              <span className="font-bold text-foreground text-lg">R$ {planPrice},00</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Ao clicar em "Pagar agora", você será redirecionado para a página segura 
              de pagamento onde poderá pagar via PIX de forma rápida e segura.
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