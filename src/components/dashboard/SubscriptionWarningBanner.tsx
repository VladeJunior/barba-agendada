import { AlertTriangle, Clock, CreditCard, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SubscriptionWarningBannerProps {
  status: "past_due" | "expired" | "trial_expired";
  graceDaysRemaining?: number;
  daysUntilExpiration?: number;
}

export function SubscriptionWarningBanner({
  status,
  graceDaysRemaining,
  daysUntilExpiration,
}: SubscriptionWarningBannerProps) {
  const navigate = useNavigate();

  const handlePayNow = () => {
    navigate("/dashboard/plans");
  };

  if (status === "expired") {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Acesso Bloqueado</p>
              <p className="text-sm text-muted-foreground">
                Sua assinatura expirou. Regularize para continuar usando o sistema.
              </p>
            </div>
          </div>
          <Button
            onClick={handlePayNow}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Regularizar Agora
          </Button>
        </div>
      </div>
    );
  }

  if (status === "past_due") {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-amber-500">Período de Carência</p>
              <p className="text-sm text-muted-foreground">
                Sua assinatura venceu.{" "}
                {graceDaysRemaining !== undefined && graceDaysRemaining > 0 ? (
                  <>
                    Você tem <strong>{graceDaysRemaining} dia{graceDaysRemaining !== 1 ? "s" : ""}</strong> para regularizar.
                  </>
                ) : (
                  "Regularize agora para evitar o bloqueio."
                )}
              </p>
            </div>
          </div>
          <Button
            onClick={handlePayNow}
            className="bg-amber-500 hover:bg-amber-500/90 text-white"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pagar Agora
          </Button>
        </div>
      </div>
    );
  }

  if (status === "trial_expired") {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Período de Teste Expirado</p>
              <p className="text-sm text-muted-foreground">
                Seu período de teste acabou. Assine para continuar usando o sistema.
              </p>
            </div>
          </div>
          <Button
            onClick={handlePayNow}
            className="bg-gold hover:bg-gold/90 text-primary-foreground"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Assinar Agora
          </Button>
        </div>
      </div>
    );
  }

  // Show warning when close to expiration (5 days or less)
  if (daysUntilExpiration !== undefined && daysUntilExpiration <= 5 && daysUntilExpiration > 0) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-amber-500">Assinatura Expirando</p>
              <p className="text-sm text-muted-foreground">
                Sua assinatura vence em <strong>{daysUntilExpiration} dia{daysUntilExpiration !== 1 ? "s" : ""}</strong>.
                Renove para não perder acesso.
              </p>
            </div>
          </div>
          <Button
            onClick={handlePayNow}
            variant="outline"
            className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Renovar Agora
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
