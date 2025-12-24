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
import { Link, Unlink, Mail, Loader2, CheckCircle, Copy, AlertTriangle } from "lucide-react";

interface LinkBarberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber: {
    id: string;
    name: string;
    user_id: string | null;
    shop_id: string;
    bio?: string | null;
    phone?: string | null;
  };
  onSuccess: () => void;
}

export function LinkBarberDialog({ open, onOpenChange, barber, onSuccess }: LinkBarberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const { data: shop } = useShop();

  const handleSendInvite = async () => {
    // Validate barber has phone
    if (!barber.phone) {
      toast.error("Este barbeiro não possui telefone cadastrado. Adicione um telefone primeiro.");
      return;
    }

    // Validate shop has W-API configured
    if (!shop?.wapi_instance_id || !shop?.wapi_token) {
      toast.error("Configure o WhatsApp nas Configurações antes de enviar convites.");
      return;
    }

    setIsLoading(true);
    setWhatsappError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const response = await supabase.functions.invoke("send-barber-invite", {
        body: {
          barber_id: barber.id,
          barber_name: barber.name,
          barber_phone: barber.phone,
          shop_name: shop?.name || "Barbearia",
          shop_id: shop?.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao enviar convite");
      }

      const result = response.data;
      setInviteUrl(result.invite_url);
      setInviteSent(true);

      if (result.whatsapp_sent) {
        toast.success("Convite enviado via WhatsApp com sucesso!");
      } else {
        setWhatsappError(result.whatsapp_error || "WhatsApp indisponível");
        toast.warning("Convite criado! WhatsApp indisponível, copie o link manualmente.");
      }
      
      onSuccess();
    } catch (error: any) {
      console.error("Error sending invite:", error);
      toast.error("Erro ao enviar convite: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Link copiado!");
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
    setInviteSent(false);
    setInviteUrl(null);
    setWhatsappError(null);
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
              : `Envie um convite via WhatsApp para ${barber.name} acessar o sistema.`}
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
            {whatsappError ? (
              <>
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <h3 className="font-medium text-foreground mb-2">Convite Criado</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {whatsappError}. Copie o link abaixo e envie manualmente para o barbeiro:
                </p>
              </>
            ) : (
              <>
                <Mail className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="font-medium text-foreground mb-2">Convite Enviado!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Uma mensagem foi enviada via WhatsApp para <strong>{barber.phone}</strong> com o link para criar a conta e aceitar o convite.
                </p>
              </>
            )}
            
            {inviteUrl && (
              <div className="mb-4">
                <div className="flex gap-2 items-center bg-muted p-2 rounded-md">
                  <Input 
                    value={inviteUrl} 
                    readOnly 
                    className="text-xs bg-transparent border-0 focus-visible:ring-0"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <Button onClick={handleClose} className="bg-gold hover:bg-gold/90">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Telefone do Barbeiro</Label>
                <Input
                  value={barber.phone || "Não cadastrado"}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O barbeiro receberá uma mensagem via WhatsApp com o link para criar sua conta.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={isLoading || !barber.phone}
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
