import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, getPlanDisplayName, getStatusDisplayName, SubscriptionPlan } from "@/hooks/useSubscription";
import { useShop } from "@/hooks/useShop";
import { supabase } from "@/integrations/supabase/client";
import { Check, Crown, Users, Zap, AlertTriangle, Calendar, Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { PaymentDialog } from "@/components/dashboard/PaymentDialog";

const plans: {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: number;
  features: string[];
  highlighted?: boolean;
  hasTrial: boolean;
}[] = [
  {
    id: "essencial",
    name: "Essencial",
    description: "Para barbearias iniciando a gestão digital",
    price: 149,
    features: [
      "Até 3 barbeiros",
      "Agenda online",
      "Suporte na própria plataforma",
      "Lembretes de agendamento via WhatsApp",
    ],
    hasTrial: false,
  },
  {
    id: "profissional",
    name: "Profissional",
    description: "Escale sua operação com dados e automações",
    price: 199,
    features: [
      "Até 5 barbeiros",
      "Agenda online",
      "Suporte preferencial na própria plataforma",
      "Lembretes de agendamento via WhatsApp",
      "Envio diário da agenda direto ao barbeiro via WhatsApp",
      "Secretária Virtual no WhatsApp (Atende 24h) 🤖",
      "Teste gratuito de 7 dias",
    ],
    highlighted: true,
    hasTrial: true,
  },
  {
    id: "elite",
    name: "Elite",
    description: "Para redes que precisam de padronização e controle",
    price: 299,
    features: [
      "Sem limite de barbeiros",
      "Agenda online",
      "Suporte preferencial na plataforma e exclusivo via WhatsApp",
      "Lembretes de agendamento via WhatsApp",
      "Envio diário da agenda direto ao barbeiro via WhatsApp",
      "Secretária Virtual no WhatsApp (Atende 24h) 🤖",
      "Exclusividade na solicitação de relatórios e melhorias",
      "Teste gratuito de 7 dias",
      "E mais...",
    ],
    hasTrial: true,
  },
];

export default function Plans() {
  const [searchParams] = useSearchParams();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<typeof plans[0] | null>(null);

  const {
    plan: currentPlan,
    status,
    maxBarbers,
    barbersUsed,
    trialDaysRemaining,
    isTrialExpired,
    currentPeriodEndsAt,
    isLoading,
    needsPlanSelection,
    isBlocked,
    isInGracePeriod,
    graceDaysRemaining,
  } = useSubscription();
  const { data: shop } = useShop();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Handle payment return from Mercado Pago
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    
    const checkPaymentAndUpdate = async () => {
      try {
        // Call edge function to verify payment status
        const { data, error } = await supabase.functions.invoke("check-payment-status");
        
        if (!error && data?.updated) {
          toast.success("Pagamento confirmado! Seu plano foi ativado.");
          queryClient.invalidateQueries({ queryKey: ["shop"] });
        } else if (!error && data?.status === "active") {
          toast.success("Pagamento aprovado! Seu plano está ativo.");
          queryClient.invalidateQueries({ queryKey: ["shop"] });
        } else if (paymentStatus === "success") {
          toast.success("Pagamento aprovado! Seu plano foi ativado.");
          queryClient.invalidateQueries({ queryKey: ["shop"] });
        }
      } catch (e) {
        console.error("Error checking payment:", e);
        if (paymentStatus === "success") {
          toast.success("Pagamento aprovado! Seu plano foi ativado.");
          queryClient.invalidateQueries({ queryKey: ["shop"] });
        }
      }
      
      navigate("/dashboard/plans", { replace: true });
    };

    if (paymentStatus === "success") {
      checkPaymentAndUpdate();
    } else if (paymentStatus === "failure") {
      toast.error("Pagamento não aprovado. Tente novamente.");
      navigate("/dashboard/plans", { replace: true });
    } else if (paymentStatus === "pending") {
      toast.info("Pagamento pendente. Aguarde a confirmação.");
      queryClient.invalidateQueries({ queryKey: ["shop"] });
      navigate("/dashboard/plans", { replace: true });
    }
  }, [searchParams, queryClient, navigate]);

  const handleSelectPlan = async (planId: SubscriptionPlan) => {
    if (!needsPlanSelection && planId === currentPlan) {
      toast.info("Você já está neste plano");
      return;
    }

    if (!shop?.id) {
      toast.error("Erro ao identificar sua barbearia");
      return;
    }

    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) return;

    // If user is in onboarding mode (first time selecting a plan)
    if (needsPlanSelection) {
      try {
        const updates: Record<string, any> = {
          plan: planId,
          subscription_status: selectedPlan.hasTrial ? 'trial' : 'active',
          has_selected_plan: true,
        };

        if (selectedPlan.hasTrial) {
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 7);
          updates.trial_ends_at = trialEnd.toISOString();
        }

        const { error } = await supabase
          .from('shops')
          .update(updates)
          .eq('id', shop.id);

        if (error) throw error;

        await queryClient.invalidateQueries({ queryKey: ["shop"] });

        toast.success(
          selectedPlan.hasTrial 
            ? `Plano ${selectedPlan.name} ativado! Você tem 7 dias de teste grátis.`
            : `Plano ${selectedPlan.name} ativado com sucesso!`
        );

        navigate('/dashboard');
      } catch (error) {
        console.error('Error selecting plan:', error);
        toast.error("Erro ao selecionar plano. Tente novamente.");
      }
      return;
    }

    // For existing users (trial expired or changing plans): show payment dialog
    setSelectedPlanForPayment(selectedPlan);
    setPaymentDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  // Blocked mode - user's subscription has expired
  if (isBlocked) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Blocked Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Acesso Bloqueado
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {status === "expired" 
              ? "Sua assinatura expirou e o período de carência terminou. Para continuar usando o InfoBarber, escolha um plano abaixo."
              : "Seu período de teste expirou. Para continuar usando o InfoBarber, escolha um plano abaixo."
            }
          </p>
        </div>

        {/* Current Plan Info */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Plano {getPlanDisplayName(currentPlan)}</p>
                <p className="text-sm text-destructive">{getStatusDisplayName(status)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((planItem) => (
            <Card
              key={planItem.id}
              className={`relative transition-all hover:scale-[1.02] ${
                planItem.highlighted
                  ? "border-gold shadow-lg shadow-gold/10 scale-[1.02]"
                  : "border-border"
              }`}
            >
              {planItem.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gold text-primary-foreground">
                    <Zap className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{planItem.name}</CardTitle>
                <CardDescription className="text-sm">{planItem.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold text-foreground font-display">
                    R$ {planItem.price}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>

                <ul className="space-y-3">
                  {planItem.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    planItem.highlighted
                      ? "bg-gold hover:bg-gold/90 text-primary-foreground"
                      : ""
                  }`}
                  variant={planItem.highlighted ? "default" : "outline"}
                  onClick={() => {
                    setSelectedPlanForPayment(planItem);
                    setPaymentDialogOpen(true);
                  }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar e Reativar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Card */}
        <Card variant="elevated">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Precisa de ajuda?</h3>
                <p className="text-sm text-muted-foreground">
                  Entre em contato conosco pelo WhatsApp e teremos prazer em ajudar você.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        {selectedPlanForPayment && (
          <PaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            planId={selectedPlanForPayment.id}
            planName={selectedPlanForPayment.name}
            planPrice={selectedPlanForPayment.price}
          />
        )}
      </div>
    );
  }

  // Onboarding mode - user hasn't selected a plan yet
  if (needsPlanSelection) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Bem-vindo ao InfoBarber!
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Para começar a usar o sistema, escolha o plano ideal para sua barbearia.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((planItem) => (
            <Card
              key={planItem.id}
              className={`relative transition-all hover:scale-[1.02] ${
                planItem.highlighted
                  ? "border-gold shadow-lg shadow-gold/10 scale-[1.02]"
                  : "border-border"
              }`}
            >
              {planItem.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gold text-primary-foreground">
                    <Zap className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{planItem.name}</CardTitle>
                <CardDescription className="text-sm">{planItem.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold text-foreground font-display">
                    R$ {planItem.price}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>

                <ul className="space-y-3">
                  {planItem.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    planItem.highlighted
                      ? "bg-gold hover:bg-gold/90 text-primary-foreground"
                      : ""
                  }`}
                  variant={planItem.highlighted ? "default" : "outline"}
                  onClick={() => handleSelectPlan(planItem.id)}
                >
                  {planItem.hasTrial ? "Começar teste grátis" : "Começar agora"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card variant="elevated">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Precisa de ajuda para escolher?</h3>
                <p className="text-sm text-muted-foreground">
                  Entre em contato conosco pelo WhatsApp e teremos prazer em ajudar você a escolher 
                  o melhor plano para sua barbearia.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal mode - user already has a plan
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Meu Plano</h1>
        <p className="text-muted-foreground">Gerencie sua assinatura e escolha o melhor plano para sua barbearia</p>
      </div>

      {/* Current Plan Status */}
      <Card variant="elevated" className="border-gold/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-gold" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Plano {getPlanDisplayName(currentPlan)}
                </CardTitle>
                <CardDescription>
                  {getStatusDisplayName(status)}
                </CardDescription>
              </div>
            </div>
            <Badge variant={status === "active" ? "default" : status === "trial" ? "secondary" : "destructive"}>
              {getStatusDisplayName(status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Users className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm text-muted-foreground">Barbeiros</p>
                <p className="font-semibold text-foreground">
                  {barbersUsed} / {maxBarbers === Infinity ? "∞" : maxBarbers}
                </p>
              </div>
            </div>

            {status === "trial" && trialDaysRemaining !== null && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Calendar className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-sm text-muted-foreground">Trial restante</p>
                  <p className="font-semibold text-foreground">
                    {isTrialExpired ? "Expirado" : `${trialDaysRemaining} dias`}
                  </p>
                </div>
              </div>
            )}

            {currentPeriodEndsAt && status === "active" && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Calendar className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-sm text-muted-foreground">Próxima renovação</p>
                  <p className="font-semibold text-foreground">
                    {currentPeriodEndsAt.toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {isTrialExpired && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Período de teste expirado</p>
                  <p className="text-sm text-muted-foreground">
                    Assine agora para continuar utilizando todos os recursos.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const plan = plans.find(p => p.id === currentPlan);
                  if (plan) {
                    setSelectedPlanForPayment(plan);
                    setPaymentDialogOpen(true);
                  }
                }}
                className="bg-gold hover:bg-gold/90 text-primary-foreground"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar agora
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Escolha seu plano</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((planItem) => {
            const isCurrentPlan = planItem.id === currentPlan;
            const isUpgrade = plans.findIndex(p => p.id === planItem.id) > plans.findIndex(p => p.id === currentPlan);
            const isDowngrade = plans.findIndex(p => p.id === planItem.id) < plans.findIndex(p => p.id === currentPlan);

            return (
              <Card
                key={planItem.id}
                className={`relative transition-all ${
                  planItem.highlighted
                    ? "border-gold shadow-lg shadow-gold/10 scale-[1.02]"
                    : "border-border"
                } ${isCurrentPlan ? "ring-2 ring-gold" : ""}`}
              >
                {planItem.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gold text-primary-foreground">
                      <Zap className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary">Atual</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{planItem.name}</CardTitle>
                  <CardDescription className="text-sm">{planItem.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-foreground font-display">
                      R$ {planItem.price}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>

                  <ul className="space-y-3">
                    {planItem.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      isCurrentPlan && !isTrialExpired
                        ? "bg-muted text-muted-foreground cursor-default"
                        : planItem.highlighted
                        ? "bg-gold hover:bg-gold/90 text-primary-foreground"
                        : ""
                    }`}
                    variant={isCurrentPlan && !isTrialExpired ? "secondary" : planItem.highlighted ? "default" : "outline"}
                    disabled={isCurrentPlan && !isTrialExpired}
                    onClick={() => handleSelectPlan(planItem.id)}
                  >
                    {isCurrentPlan && !isTrialExpired
                      ? "Plano Atual"
                      : isCurrentPlan && isTrialExpired
                      ? `Assinar R$ ${planItem.price}`
                      : isUpgrade
                      ? `Assinar R$ ${planItem.price}`
                      : isDowngrade
                      ? `Assinar R$ ${planItem.price}`
                      : `Assinar R$ ${planItem.price}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <Card variant="elevated">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Precisa de ajuda para escolher?</h3>
              <p className="text-sm text-muted-foreground">
                Entre em contato conosco pelo WhatsApp e teremos prazer em ajudar você a escolher 
                o melhor plano para sua barbearia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      {selectedPlanForPayment && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          planId={selectedPlanForPayment.id}
          planName={selectedPlanForPayment.name}
          planPrice={selectedPlanForPayment.price}
        />
      )}
    </div>
  );
}
