import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchProfile();
    }
  }, [open, user]);

  const fetchProfile = async () => {
    if (!user) return;

    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, tax_id")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setFullName(data?.full_name || "");
      setPhone(data?.phone || "");
      setTaxId(data?.tax_id || "");
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const name = fullName.trim();
    const phoneValue = phone.trim();
    const taxDigits = taxId.replace(/\D/g, "");

    if (!name) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu nome completo.",
        variant: "destructive",
      });
      return;
    }

    // Required for billing with AbacatePay
    if (!phoneValue) {
      toast({
        title: "Campo obrigatório",
        description: "Informe seu telefone (WhatsApp) com DDD.",
        variant: "destructive",
      });
      return;
    }

    if (!(taxDigits.length === 11 || taxDigits.length === 14)) {
      toast({
        title: "CPF/CNPJ inválido",
        description: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name, phone: phoneValue, tax_id: taxDigits })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar suas informações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Minha Conta</DialogTitle>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (WhatsApp)</Label>
              <PhoneInput id="phone" value={phone} onChange={(v) => setPhone(v)} />
              <p className="text-xs text-muted-foreground">
                Necessário para gerar cobranças e enviar lembretes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">CPF/CNPJ</Label>
              <Input
                id="taxId"
                type="text"
                inputMode="numeric"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Somente números (CPF ou CNPJ)"
                maxLength={18}
              />
              <p className="text-xs text-muted-foreground">Necessário para gerar cobranças.</p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
