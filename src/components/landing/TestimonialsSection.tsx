import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ricardo Santos",
    role: "Dono da Barbearia Santos",
    location: "São Paulo, SP",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: "Desde que comecei a usar o BarberPro, minhas faltas diminuíram 80%. Os lembretes automáticos são um game changer.",
    rating: 5
  },
  {
    name: "Carlos Mendes",
    role: "Proprietário da Barber Shop Elite",
    location: "Rio de Janeiro, RJ",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    content: "A gestão da minha equipe ficou muito mais simples. Consigo ver o desempenho de cada barbeiro em tempo real.",
    rating: 5
  },
  {
    name: "Fernando Costa",
    role: "CEO da Rede Barba & Navalha",
    location: "Belo Horizonte, MG",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    content: "Gerencio 5 unidades com facilidade. O relatório consolidado me ajuda a tomar decisões estratégicas.",
    rating: 5
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-gradient-dark">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-gold text-sm font-semibold uppercase tracking-wider">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mt-4 mb-6">
            O que nossos clientes dizem
          </h2>
          <p className="text-lg text-muted-foreground">
            Mais de 500 barbearias já transformaram sua gestão com o BarberPro.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} variant="elevated" className="relative">
              <CardContent className="p-6 pt-8">
                {/* Quote Icon */}
                <div className="absolute -top-4 left-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center">
                    <Quote className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground mb-6 italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gold/30"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-gold">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
