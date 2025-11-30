import { Button } from "@/components/ui/button";
import { ArrowRight, Scissors } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-dark relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold mb-8 animate-float">
            <Scissors className="w-8 h-8 text-primary-foreground" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
            Pronto para transformar sua{" "}
            <span className="text-gradient-gold">barbearia</span>?
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Junte-se a mais de 500 barbearias que já usam o BarberPro para gerenciar agendamentos, 
            fidelizar clientes e aumentar o faturamento.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline-gold" size="xl" asChild>
              <Link to="/demo">Agendar Demo</Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <p className="text-sm text-muted-foreground mt-8">
            ✓ Sem cartão de crédito &nbsp;&nbsp; ✓ Configuração em 10 minutos &nbsp;&nbsp; ✓ Suporte gratuito
          </p>
        </div>
      </div>
    </section>
  );
}
