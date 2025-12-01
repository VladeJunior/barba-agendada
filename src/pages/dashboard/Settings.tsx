import { useState, useEffect } from "react";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Store, MapPin, Link, Copy, Check, MessageSquare, Mail, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Settings() {
  const { data: shop, isLoading, refetch } = useShop();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    slug: "",
    wapi_instance_id: "",
    wapi_token: "",
  });
  const [copied, setCopied] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestingCredentials, setRequestingCredentials] = useState(false);

  const bookingUrl = `${window.location.origin}/agendar/${formData.slug}`;

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || "",
        description: shop.description || "",
        phone: shop.phone || "",
        address: shop.address || "",
        city: shop.city || "",
        state: shop.state || "",
        slug: shop.slug || "",
        wapi_instance_id: (shop as any).wapi_instance_id || "",
        wapi_token: (shop as any).wapi_token || "",
      });
    }
  }, [shop]);

  const validateSlug = (slug: string) => {
    if (slug.length < 3) {
      return "Slug deve ter pelo menos 3 caracteres";
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return "Use apenas letras minúsculas, números e hífens";
    }
    return "";
  };

  const handleSlugChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setFormData({ ...formData, slug: formatted });
    setSlugError(validateSlug(formatted));
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestCredentials = async () => {
    setRequestingCredentials(true);
    try {
      const { error } = await supabase.functions.invoke("request-wapi-credentials", {
        body: {
          ownerName: user?.user_metadata?.full_name || user?.email || "Não informado",
          ownerEmail: user?.email || "",
          shopName: formData.name,
          shopPhone: formData.phone,
        },
      });

      if (error) throw error;

      toast.success("Solicitação enviada! Aguarde contato por email.");
      setRequestDialogOpen(false);
    } catch (error: any) {
      console.error("Error requesting credentials:", error);
      toast.error("Erro ao enviar solicitação: " + error.message);
    } finally {
      setRequestingCredentials(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({
          name: formData.name,
          description: formData.description,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          slug: formData.slug,
          wapi_instance_id: formData.wapi_instance_id || null,
          wapi_token: formData.wapi_token || null,
        })
        .eq("id", shop.id);

      if (error) throw error;
      
      toast.success("Configurações salvas com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  const isWapiConfigured = formData.wapi_instance_id && formData.wapi_token;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as informações da sua barbearia</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-gold" />
              Informações da Barbearia
            </CardTitle>
            <CardDescription>
              Dados que serão exibidos para seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Barbearia</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da sua barbearia"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva sua barbearia..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold" />
              Endereço
            </CardTitle>
            <CardDescription>
              Localização da sua barbearia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-gold" />
              Link de Agendamento
            </CardTitle>
            <CardDescription>
              Compartilhe este link com seus clientes para agendamento online
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Identificador único (slug)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="minha-barbearia"
              />
              {slugError && (
                <p className="text-sm text-destructive">{slugError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Use apenas letras minúsculas, números e hífens
              </p>
            </div>

            {formData.slug && !slugError && (
              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Seu link de agendamento:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded text-sm break-all">
                    {bookingUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold" />
              Integração WhatsApp
              {isWapiConfigured && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded-full">
                  Configurado
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Configure sua conta W-API para enviar mensagens automáticas de confirmação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wapi_instance_id">ID da Instância</Label>
              <Input
                id="wapi_instance_id"
                value={formData.wapi_instance_id}
                onChange={(e) => setFormData({ ...formData, wapi_instance_id: e.target.value })}
                placeholder="Ex: abc123-instance-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wapi_token">Token da Instância</Label>
              <div className="relative">
                <Input
                  id="wapi_token"
                  type={showToken ? "text" : "password"}
                  value={formData.wapi_token}
                  onChange={(e) => setFormData({ ...formData, wapi_token: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Não possui credenciais W-API? Solicite abaixo e entraremos em contato.
              </p>
              <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Solicitar ID e Token
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Credenciais W-API</DialogTitle>
                    <DialogDescription>
                      Enviaremos um email com os dados da sua barbearia para nossa equipe.
                      Você receberá as credenciais no email cadastrado.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                      <p><strong>Barbearia:</strong> {formData.name || "Não informado"}</p>
                      <p><strong>Telefone:</strong> {formData.phone || "Não informado"}</p>
                      <p><strong>Email:</strong> {user?.email || "Não informado"}</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRequestDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleRequestCredentials}
                      disabled={requestingCredentials}
                      className="bg-gold hover:bg-gold/90"
                    >
                      {requestingCredentials ? "Enviando..." : "Enviar Solicitação"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button 
            type="submit" 
            className="bg-gold hover:bg-gold/90"
            disabled={saving || !!slugError}
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
