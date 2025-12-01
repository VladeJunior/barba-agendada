import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/hooks/useShop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link, Unlink, Mail, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Email inválido").max(255, "Email muito longo");

interface LinkBarberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber: {
    id: string;
    name: string;
    user_id: string | null;
    shop_id: string;
    bio?: string | null;
  };
  onSuccess: () => void;
}

export function LinkBarberDialog({ open, onOpenChange, barber, onSuccess }: LinkBarberDialogProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const { data: shop } = useShop();

  const handleSendInvite = async () => {
    // Validate email
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const response = await supabase.functions.invoke("send-barber-invite", {
        body: {
          barber_id: barber.id,
          email: email.trim().toLowerCase(),
          barber_name: barber.name,
          shop_name: shop?.name || "Barbearia",
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao enviar convite");
      }

      setInviteSent(true);
      toast.success("Convite enviado com sucesso!");
      onSuccess();
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast.error("Erro ao enviar convite: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    setIsLoading(true);
    try {
      // Remove user_id from barber
      const { error: barberError } = await supabase
        .from("barbers")
        .update({ user_id: null })
        .eq("id", barber.id);

      if (barberError) throw barberError;

      // Remove user_roles entry
      if (barber.user_id) {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", barber.user_id)
          .eq("shop_id", barber.shop_id)
          .eq("role", "barber");
      }

      toast.success("Acesso removido com sucesso!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao remover acesso: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setInviteSent(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {barber.user_id ? "Gerenciar Acesso" : "Convidar Barbeiro"}
          </DialogTitle>
          <DialogDescription>
            {barber.user_id
              ? `${barber.name} já possui acesso ao sistema.`
              : `Envie um convite por email para ${barber.name} acessar o sistema.`}
          </DialogDescription>
        </DialogHeader>

        {barber.user_id ? (
          <div className="py-4">
            <div className="flex items-center gap-2 text-green-500 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">Barbeiro vinculado com sucesso</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Este barbeiro possui acesso ao sistema e pode visualizar sua agenda e comissões.
            </p>
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Unlink className="w-4 h-4 mr-2" />
              Remover Acesso
            </Button>
          </div>
        ) : inviteSent ? (
          <div className="py-6 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gold" />
            <h3 className="font-medium text-foreground mb-2">Convite Enviado!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Um email foi enviado para <strong>{email}</strong> com instruções para criar a conta e aceitar o convite.
            </p>
            <Button onClick={handleClose} className="bg-gold hover:bg-gold/90">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do Barbeiro</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="barbeiro@email.com"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  O barbeiro receberá um email com link para criar conta e aceitar o convite.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={isLoading || !email.trim()}
                className="bg-gold hover:bg-gold/90"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Mail className="w-4 h-4 mr-2" />
                Enviar Convite
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
