import { Instagram, Linkedin, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/infobarber-logo.png";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="InfoBarber" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-xl font-display font-bold text-foreground">
                Info<span className="text-gold">Barber</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6">
              Sistema completo de agendamento para barbearias. 
              Simplifique sua gestão e aumente seu faturamento.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/infosage_tecnologia/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-gold/20 transition-colors">
                <Instagram className="w-5 h-5 text-foreground" />
              </a>
              <a href="https://www.linkedin.com/company/infosage-consultoria/about/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-gold/20 transition-colors">
                <Linkedin className="w-5 h-5 text-foreground" />
              </a>
              <a href="https://wa.me/5519998733540?text=Gostaria%20de%20mais%20informações%20sobre%20o%20sistema%20InfoBarber" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-gold/20 transition-colors">
                <MessageCircle className="w-5 h-5 text-foreground" />
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

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-gold" />
                contato@infobarber.com.br
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-gold" />
                (19) 99873-3540
              </li>
              <li className="flex items-start gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                Americana, SP - Brasil
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2025 InfoBarber. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/termos" className="hover:text-primary transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link to="/privacidade" className="hover:text-primary transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
