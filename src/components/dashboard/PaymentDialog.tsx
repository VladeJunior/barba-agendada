import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard } from "lucide-react";
import { SubscriptionPlan } from "@/hooks/useSubscription";
import { TransparentCheckout } from "./TransparentCheckout";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: SubscriptionPlan;
  planName: string;
  planPrice: number;
}

export function PaymentDialog({ open, onOpenChange, planId, planName, planPrice }: PaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            Assinar Plano {planName}
          </DialogTitle>
        </DialogHeader>

        <TransparentCheckout
          planId={planId}
          planName={planName}
          planPrice={planPrice}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
