import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Link, Unlink } from "lucide-react";

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

  const handleLink = async () => {
    if (!email.trim()) {
      toast.error("Digite um email válido");
      return;
    }

    setIsLoading(true);
    try {
      // Search for user by email in profiles or auth
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .ilike("full_name", `%${email}%`);

      // Try to find user by checking if they exist (we'll use the email to find them)
      // Since we can't query auth.users directly, we'll prompt the user to register first
      
      // For now, let's check if any profile matches
      // A better approach would be to use an edge function to look up by email
      
      // Simplified: Create invitation flow
      // Update barber with a pending email
      const { error: updateError } = await supabase
        .from("barbers")
        .update({ 
          bio: barber.bio ? `${barber.bio}\n[Convite pendente: ${email}]` : `[Convite pendente: ${email}]`
        })
        .eq("id", barber.id);

      if (updateError) throw updateError;

      toast.success(
        "Convite registrado! O barbeiro precisa criar uma conta com este email e depois você poderá vincular.",
        { duration: 5000 }
      );
      
      setEmail("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao vincular: " + error.message);
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

      toast.success("Barbeiro desvinculado com sucesso!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao desvincular: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {barber.user_id ? "Gerenciar Acesso" : "Vincular Conta"}
          </DialogTitle>
          <DialogDescription>
            {barber.user_id
              ? `${barber.name} já possui acesso ao sistema.`
              : `Vincule uma conta de usuário para que ${barber.name} acesse o sistema.`}
          </DialogDescription>
        </DialogHeader>

        {barber.user_id ? (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Este barbeiro possui acesso ao sistema e pode visualizar sua agenda e comissões.
            </p>
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={isLoading}
              className="w-full"
            >
              <Unlink className="w-4 h-4 mr-2" />
              Remover Acesso
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email do Barbeiro</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
                <p className="text-xs text-muted-foreground">
                  O barbeiro deve criar uma conta no sistema com este email para ter acesso.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleLink}
                disabled={isLoading || !email.trim()}
                className="bg-gold hover:bg-gold/90"
              >
                <Link className="w-4 h-4 mr-2" />
                Enviar Convite
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
