import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, getPlanDisplayName, getStatusDisplayName, SubscriptionPlan } from "@/hooks/useSubscription";
import { Check, Crown, Users, Zap, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";

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
      "Exclusividade na solicitação de relatórios e melhorias",
      "Teste gratuito de 7 dias",
      "E mais...",
    ],
    hasTrial: true,
  },
];

export default function Plans() {
  const {
    plan: currentPlan,
    status,
    maxBarbers,
    barbersUsed,
    trialDaysRemaining,
    isTrialExpired,
    currentPeriodEndsAt,
    isLoading,
  } = useSubscription();

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    if (planId === currentPlan) {
      toast.info("Você já está neste plano");
      return;
    }
    // TODO: Integrate with payment provider
    toast.info("Em breve! Integração com pagamento será disponibilizada.");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

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
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Período de teste expirado</p>
                <p className="text-sm text-muted-foreground">
                  Escolha um plano para continuar utilizando todos os recursos.
                </p>
              </div>
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
                      isCurrentPlan
                        ? "bg-muted text-muted-foreground cursor-default"
                        : planItem.highlighted
                        ? "bg-gold hover:bg-gold/90 text-primary-foreground"
                        : ""
                    }`}
                    variant={isCurrentPlan ? "secondary" : planItem.highlighted ? "default" : "outline"}
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(planItem.id)}
                  >
                    {isCurrentPlan
                      ? "Plano Atual"
                      : isUpgrade
                      ? "Fazer Upgrade"
                      : isDowngrade
                      ? "Fazer Downgrade"
                      : "Selecionar"}
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
    </div>
  );
}
