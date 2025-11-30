import { Scissors, Instagram, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">
                Barber<span className="text-gold">Pro</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6">
              Sistema completo de agendamento para barbearias. 
              Simplifique sua gestão e aumente seu faturamento.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-gold/20 transition-colors">
                <Instagram className="w-5 h-5 text-foreground" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-gold/20 transition-colors">
                <Facebook className="w-5 h-5 text-foreground" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-gold/20 transition-colors">
                <Youtube className="w-5 h-5 text-foreground" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Produto</h3>
            <ul className="space-y-3">
              <li><a href="#features" className="text-muted-foreground hover:text-gold transition-colors text-sm">Funcionalidades</a></li>
              <li><a href="#pricing" className="text-muted-foreground hover:text-gold transition-colors text-sm">Preços</a></li>
              <li><Link to="/demo" className="text-muted-foreground hover:text-gold transition-colors text-sm">Demonstração</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">Integrações</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Empresa</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">Sobre nós</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">Carreiras</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">Contato</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-gold" />
                contato@barberpro.com.br
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-gold" />
                (11) 99999-9999
              </li>
              <li className="flex items-start gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                São Paulo, SP - Brasil
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 BarberPro. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">
              Termos de Uso
            </a>
            <a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">
              Política de Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
