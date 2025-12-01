import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-barbershop.jpg";
export function HeroSection() {
  return <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={heroImage} alt="Interior de barbearia premium" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8 animate-fade-in">
            <Star className="w-4 h-4 text-gold" />
          <span className="text-sm text-gold font-medium">+50 barbearias já utilizam o InfoBarber</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-foreground mb-6 animate-slide-up" style={{
          animationDelay: "0.1s"
        }}>
            Gerencie sua{" "}
            <span className="text-gradient-gold">barbearia</span>
            {" "}com elegância
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl animate-slide-up" style={{
          animationDelay: "0.2s"
        }}>
            Sistema completo de agendamento, gestão de profissionais e fidelização de clientes. 
            Aumente seu faturamento e reduza as faltas em até 70%.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up" style={{
          animationDelay: "0.3s"
        }}>
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline-gold" size="xl" asChild>
              <Link to="/demo">Ver Demonstração</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg animate-slide-up" style={{
          animationDelay: "0.4s"
        }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-gold" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">5K+</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Agendamentos/mês</p>
            </div>
            <div className="text-center border-x border-border">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-5 h-5 text-gold" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">50+</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Barbearias</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="w-5 h-5 text-gold" />
                <span className="text-2xl md:text-3xl font-bold text-foreground">4.9</span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Avaliação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>;
}