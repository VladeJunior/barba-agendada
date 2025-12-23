import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Users, 
  Bell, 
  BarChart3, 
  Smartphone, 
  Shield,
  Clock,
  Star
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agendamento 24 horas",
    description: "Seus clientes agendam pelo link ou pelo WhatsApp, a qualquer hora. Nossa secretária virtual responde automaticamente. 🤖"
  },
  {
    icon: Users,
    title: "Gestão de Barbeiros",
    description: "Cadastre sua equipe, defina horários de trabalho e calcule comissões automaticamente."
  },
  {
    icon: Bell,
    title: "Lembretes Automáticos",
    description: "Lembretes automáticos via WhatsApp antes de cada atendimento. Reduza faltas em até 70%."
  },
  {
    icon: BarChart3,
    title: "Relatórios Completos",
    description: "Acompanhe faturamento, serviços mais populares e performance de cada barbeiro."
  },
  {
    icon: Smartphone,
    title: "100% Responsivo",
    description: "Funciona perfeitamente no celular, tablet ou computador. Para você e seus clientes."
  },
  {
    icon: Clock,
    title: "Tempo Real",
    description: "Veja sua agenda atualizar instantaneamente. Sem refresh, sem espera."
  },
  {
    icon: Shield,
    title: "Segurança Total",
    description: "Seus dados e de seus clientes protegidos com criptografia de ponta."
  },
  {
    icon: Star,
    title: "Programa de Fidelidade",
    description: "Crie seu próprio programa de pontos e fidelize seus clientes."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gradient-dark">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-gold text-sm font-semibold uppercase tracking-wider">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mt-4 mb-6">
            Tudo que sua barbearia precisa
          </h2>
          <p className="text-lg text-muted-foreground">
            Desenvolvido pensando nas necessidades reais de donos de barbearia. 
            Simples de usar, poderoso nos resultados.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              variant="elevated" 
              className="group hover:border-gold/30 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 font-display">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
