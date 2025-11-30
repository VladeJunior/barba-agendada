import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Building2, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/infobarber-logo.jpg";

const benefits = [
  "Agendamento online 24/7",
  "Lembretes automáticos",
  "Gestão completa da agenda",
  "Relatórios de desempenho"
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate registration - Replace with actual auth logic
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Cadastro simulado",
        description: "Conecte o Lovable Cloud para ativar autenticação real.",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-dark p-12 flex-col justify-center relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-12">
            <img src={logo} alt="InfoBarber" className="w-12 h-12 rounded-xl object-cover" />
            <span className="text-2xl font-display font-bold text-foreground">
              Info<span className="text-gold">Barber</span>
            </span>
          </Link>

          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
            Transforme sua barbearia em um{" "}
            <span className="text-gradient-gold">negócio de sucesso</span>
          </h1>

          <p className="text-muted-foreground mb-8">
            Junte-se a mais de 500 barbearias que já utilizam o InfoBarber para 
            gerenciar agendamentos e aumentar o faturamento.
          </p>

          <ul className="space-y-4">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-gold" />
                </div>
                <span className="text-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para início
          </Link>

          <Card variant="elevated" className="border-border">
            <CardHeader className="text-center pb-2">
              {/* Mobile Logo */}
              <div className="flex justify-center mb-4 lg:hidden">
                <img src={logo} alt="InfoBarber" className="w-16 h-16 rounded-xl object-cover shadow-gold" />
              </div>
              <CardTitle className="text-2xl">Criar conta grátis</CardTitle>
              <CardDescription>
                Comece a usar o InfoBarber agora mesmo
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="João Silva"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopName">Nome da barbearia</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="shopName"
                      type="text"
                      placeholder="Barbearia do João"
                      value={formData.shopName}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10"
                      minLength={8}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="gold" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar conta grátis"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ao criar uma conta, você concorda com nossos{" "}
                  <a href="#" className="text-gold hover:underline">Termos de Uso</a>
                  {" "}e{" "}
                  <a href="#" className="text-gold hover:underline">Política de Privacidade</a>.
                </p>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Já tem uma conta?{" "}
                  <Link to="/login" className="text-gold hover:text-gold-light transition-colors font-medium">
                    Fazer login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
