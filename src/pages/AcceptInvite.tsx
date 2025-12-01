import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import logo from "@/assets/infobarber-logo.jpg";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  
  const [mode, setMode] = useState<"register" | "login">("register");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Fetch invitation details
  const { data: invitation, isLoading: loadingInvitation, error: invitationError } = useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      if (!token) throw new Error("Token não fornecido");

      const { data, error } = await supabase
        .from("barber_invitations")
        .select(`
          *,
          barber:barbers(name),
          shop:shops(name)
        `)
        .eq("token", token)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  // Pre-fill email from invitation
  useEffect(() => {
    if (invitation?.email) {
      setFormData(prev => ({ ...prev, email: invitation.email }));
    }
    if (invitation?.barber?.name) {
      setFormData(prev => ({ ...prev, name: invitation.barber.name }));
    }
  }, [invitation]);

  // If user is already logged in, try to accept invitation
  useEffect(() => {
    if (user && invitation && invitation.status === "pending") {
      acceptInvitation(user.id);
    }
  }, [user, invitation]);

  const acceptInvitation = async (userId: string) => {
    try {
      // Update barber with user_id
      const { error: barberError } = await supabase
        .from("barbers")
        .update({ user_id: userId })
        .eq("id", invitation!.barber_id);

      if (barberError) throw barberError;

      // Create user_roles entry
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          shop_id: invitation!.shop_id,
          role: "barber",
        });

      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }

      // Update invitation status
      await supabase
        .from("barber_invitations")
        .update({ 
          status: "accepted",
          accepted_at: new Date().toISOString()
        })
        .eq("id", invitation!.id);

      toast.success("Convite aceito com sucesso!");
      navigate("/dashboard/my-dashboard");
    } catch (error: any) {
      toast.error("Erro ao aceitar convite: " + error.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, formData.name);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email já está cadastrado. Faça login para continuar.");
          setMode("login");
        } else {
          throw error;
        }
      } else {
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (error: any) {
      toast.error("Erro ao criar conta: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      // The useEffect will handle accepting the invitation after login
    } catch (error: any) {
      toast.error("Erro ao fazer login: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingInvitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold text-foreground mb-2">Convite não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Este convite pode ter expirado ou já foi utilizado.
            </p>
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold text-foreground mb-2">Convite já aceito</h2>
            <p className="text-muted-foreground mb-6">
              Este convite já foi utilizado. Faça login para acessar o sistema.
            </p>
            <Button asChild>
              <Link to="/login">Fazer Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "expired" || new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-bold text-foreground mb-2">Convite expirado</h2>
            <p className="text-muted-foreground mb-6">
              Este convite expirou. Solicite um novo convite ao proprietário da barbearia.
            </p>
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="InfoBarber" className="w-16 h-16 rounded-lg object-cover" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo à {invitation.shop?.name}!</CardTitle>
          <CardDescription>
            Você foi convidado para fazer parte da equipe como barbeiro.
            {mode === "register" 
              ? " Crie sua conta para começar." 
              : " Faça login para aceitar o convite."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === "register" ? handleRegister : handleLogin} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gold hover:bg-gold/90"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "register" ? "Criar Conta e Aceitar" : "Entrar e Aceitar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "register" ? "login" : "register")}
              className="text-sm text-gold hover:underline"
            >
              {mode === "register" 
                ? "Já tem uma conta? Faça login" 
                : "Não tem conta? Crie uma"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
