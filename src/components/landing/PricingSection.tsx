import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Essencial",
    description: "Para barbearias iniciando a gestão digital",
    price: "R$ 99",
    period: "/mês",
    features: [
      "Até 3 barbeiros",
      "Agenda online",
      "Suporte na própria plataforma",
      "Lembretes de agendamento via WhatsApp",
    ],
    cta: "Começar Agora",
    variant: "outline" as const,
    popular: false,
  },
  {
    name: "Profissional",
    description: "Escale sua operação com dados e automações",
    price: "R$ 149",
    period: "/mês",
    features: [
      "Até 5 barbeiros",
      "Agenda online",
      "Suporte preferencial na própria plataforma",
      "Lembretes de agendamento via WhatsApp",
      "Envio diário da agenda direto ao barbeiro via WhatsApp",
      "Secretária Virtual no WhatsApp (Atende 24h) 🤖",
      "Teste gratuito de 7 dias",
    ],
    cta: "Começar Teste Grátis",
    variant: "gold" as const,
    popular: true,
  },
  {
    name: "Elite",
    description: "Para redes que precisam de padronização e controle",
    price: "R$ 199",
    period: "/mês",
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
    cta: "Começar Teste Grátis",
    variant: "outline" as const,
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-gold text-sm font-semibold uppercase tracking-wider">
            Planos e Preços
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mt-4 mb-6">
            Escolha o plano ideal
          </h2>
          <p className="text-lg text-muted-foreground">
            Planos pensados para cada fase do seu negócio. 
            Sem taxas escondidas, cancele quando quiser.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              variant={plan.popular ? "gold" : "pricing"}
              className={`relative ${plan.popular ? "scale-105 z-10" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-gradient-gold text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    <Zap className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="text-center mb-8">
                  <span className="text-4xl md:text-5xl font-bold text-foreground font-display">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-gold" />
                      </div>
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.variant} 
                  className="w-full" 
                  size="lg"
                  asChild
                >
                  <Link to="/register">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
