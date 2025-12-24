import { useState, useEffect, useCallback } from "react";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Store, MapPin, Link, Copy, Check, MessageSquare, Mail, Eye, EyeOff, QrCode, Wifi, WifiOff, Loader2, Send, Power, Image, Gift, Bot } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
export default function Settings() {
  const {
    data: shop,
    isLoading,
    refetch
  } = useShop();
  const {
    user
  } = useAuth();
  const { plan } = useSubscription();
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
    loyalty_points_expiration_months: 12,
    whatsapp_bot_enabled: false
  });
  const [copied, setCopied] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestingCredentials, setRequestingCredentials] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connected" | "loading">("loading");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const bookingUrl = `${window.location.origin}/agendar/${formData.slug}`;
  const checkInstanceStatus = useCallback(async () => {
    if (!formData.wapi_instance_id || !formData.wapi_token) {
      setConnectionStatus("disconnected");
      return;
    }
    setCheckingStatus(true);
    try {
      const response = await fetch(`https://barber-bot-production.up.railway.app/v1/instance/status-instance?instanceId=${formData.wapi_instance_id}`, {
        headers: {
          Authorization: `Bearer ${formData.wapi_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(data.connected ? "connected" : "disconnected");
      } else {
        setConnectionStatus("disconnected");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setConnectionStatus("disconnected");
    } finally {
      setCheckingStatus(false);
    }
  }, [formData.wapi_instance_id, formData.wapi_token]);
  useEffect(() => {
    if (formData.wapi_instance_id && formData.wapi_token) {
      checkInstanceStatus();
    } else {
      setConnectionStatus("disconnected");
    }
  }, [formData.wapi_instance_id, formData.wapi_token, checkInstanceStatus]);
  const handleDisconnect = async () => {
    if (!formData.wapi_instance_id || !formData.wapi_token) return;
    setDisconnecting(true);
    try {
      const response = await fetch(`https://barber-bot-production.up.railway.app/v1/instance/reset?instanceId=${formData.wapi_instance_id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${formData.wapi_token}`
        }
      });
      if (response.ok) {
        toast.success("WhatsApp desconectado com sucesso!");
        setConnectionStatus("disconnected");
      } else {
        throw new Error("Falha ao desconectar");
      }
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast.error("Erro ao desconectar: " + error.message);
    } finally {
      setDisconnecting(false);
    }
  };
  const fetchQrCode = async () => {
    if (!formData.wapi_instance_id || !formData.wapi_token) {
      toast.error("Configure o ID e Token da instância primeiro");
      return;
    }
    setLoadingQr(true);
    setQrCodeImage(null);
    setQrDialogOpen(true);
    try {
      const response = await fetch(`https://barber-bot-production.up.railway.app/v1/instance/qr-code?instanceId=${formData.wapi_instance_id}&image=enable`, {
        headers: {
          Authorization: `Bearer ${formData.wapi_token}`
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("QR Code error response:", errorText);
        throw new Error("Falha ao buscar QR Code");
      }
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("image/")) {
        // Response is a direct image (PNG)
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setQrCodeImage(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } else {
        // Response is JSON
        const data = await response.json();
        console.log("QR Code API response:", data);
        if (data.qrcode) {
          // Novo formato da API BarberBot (lowercase)
          setQrCodeImage(data.qrcode);
        } else if (data.qrCode) {
          // Formato legado W-API (camelCase)
          setQrCodeImage(data.qrCode);
        } else if (data.base64) {
          setQrCodeImage(`data:image/png;base64,${data.base64}`);
        } else if (data.connected) {
          toast.info("WhatsApp já está conectado!");
          setQrDialogOpen(false);
          checkInstanceStatus();
        } else {
          console.log("Resposta inesperada da API:", data);
          toast.error("Formato de QR Code não reconhecido");
          setQrDialogOpen(false);
        }
      }
    } catch (error: any) {
      console.error("Error fetching QR code:", error);
      toast.error("Erro ao buscar QR Code: " + error.message);
      setQrDialogOpen(false);
    } finally {
      setLoadingQr(false);
    }
  };
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (qrDialogOpen && qrCodeImage) {
      interval = setInterval(async () => {
        await checkInstanceStatus();
        if (connectionStatus === "connected") {
          toast.success("WhatsApp conectado com sucesso!");
          setQrDialogOpen(false);
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [qrDialogOpen, qrCodeImage, connectionStatus, checkInstanceStatus]);
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
        loyalty_points_expiration_months: (shop as any).loyalty_points_expiration_months ?? 12,
        whatsapp_bot_enabled: (shop as any).whatsapp_bot_enabled ?? false
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
    setFormData({
      ...formData,
      slug: formatted
    });
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
      const {
        error
      } = await supabase.functions.invoke("request-wapi-credentials", {
        body: {
          ownerName: user?.user_metadata?.full_name || user?.email || "Não informado",
          ownerEmail: user?.email || "",
          shopName: formData.name,
          shopPhone: formData.phone
        }
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
  const handleTestWhatsApp = async () => {
    if (!shop?.id) {
      toast.error("Barbearia não encontrada");
      return;
    }
    if (!formData.phone) {
      toast.error("Configure o telefone da barbearia primeiro");
      return;
    }
    if (connectionStatus !== "connected") {
      toast.error("WhatsApp não está conectado");
      return;
    }
    setTestingWhatsApp(true);
    try {
      const {
        error
      } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          shopId: shop.id,
          phone: formData.phone,
          message: `✅ Teste de integração InfoBarber\n\nSua integração com WhatsApp está funcionando corretamente!\n\nBarbearia: ${formData.name}`
        }
      });
      if (error) throw error;
      toast.success("Mensagem de teste enviada com sucesso!");
    } catch (error: any) {
      console.error("Error sending test message:", error);
      toast.error("Erro ao enviar mensagem: " + error.message);
    } finally {
      setTestingWhatsApp(false);
    }
  };
  const handleLogoUpload = async (url: string) => {
    if (!shop) return;
    try {
      const {
        error
      } = await supabase.from("shops").update({
        logo_url: url
      }).eq("id", shop.id);
      if (error) throw error;
      refetch();
    } catch (error: any) {
      console.error("Error updating logo:", error);
    }
  };
  const handleCoverUpload = async (url: string) => {
    if (!shop) return;
    try {
      const {
        error
      } = await supabase.from("shops").update({
        cover_url: url
      }).eq("id", shop.id);
      if (error) throw error;
      refetch();
    } catch (error: any) {
      console.error("Error updating cover:", error);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from("shops").update({
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        slug: formData.slug,
        wapi_instance_id: formData.wapi_instance_id || null,
        wapi_token: formData.wapi_token || null,
        loyalty_points_expiration_months: formData.loyalty_points_expiration_months || null,
        whatsapp_bot_enabled: formData.whatsapp_bot_enabled
      }).eq("id", shop.id);
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
    return <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>;
  }
  const isWapiConfigured = !!formData.wapi_instance_id;
  return <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as informações da sua barbearia</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-gold" />
              Imagens da Barbearia
            </CardTitle>
            <CardDescription>
              Personalize a aparência da sua barbearia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUpload label="Logo" bucket="shop-logos" path={shop?.id || ""} currentImageUrl={shop?.logo_url} onUploadComplete={handleLogoUpload} aspectRatio="square" maxSizeMB={5} />

              <ImageUpload label="Imagem de Capa" bucket="shop-covers" path={shop?.id || ""} currentImageUrl={shop?.cover_url} onUploadComplete={handleCoverUpload} aspectRatio="wide" maxSizeMB={10} />
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="mt-6">
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
              <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="Nome da sua barbearia" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} placeholder="Descreva sua barbearia..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={formData.phone} onChange={e => setFormData({
              ...formData,
              phone: e.target.value
            })} placeholder="(00) 00000-0000" />
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
              <Input id="address" value={formData.address} onChange={e => setFormData({
              ...formData,
              address: e.target.value
            })} placeholder="Rua, número, bairro" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" value={formData.city} onChange={e => setFormData({
                ...formData,
                city: e.target.value
              })} placeholder="Cidade" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" value={formData.state} onChange={e => setFormData({
                ...formData,
                state: e.target.value
              })} placeholder="UF" maxLength={2} />
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
              <Input id="slug" value={formData.slug} onChange={e => handleSlugChange(e.target.value)} placeholder="minha-barbearia" />
              {slugError && <p className="text-sm text-destructive">{slugError}</p>}
              <p className="text-xs text-muted-foreground">
                Use apenas letras minúsculas, números e hífens
              </p>
            </div>

            {formData.slug && !slugError && <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Seu link de agendamento:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded text-sm break-all">
                    {bookingUrl}
                  </code>
                  <Button type="button" variant="outline" size="icon" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>}
          </CardContent>
        </Card>

        <Card variant="elevated" className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-gold" />
              Programa de Fidelidade
            </CardTitle>
            <CardDescription>
              Configure a expiração de pontos do programa de fidelidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loyalty-expiration">Validade dos Pontos (meses)</Label>
              <Input id="loyalty-expiration" type="number" min="1" max="60" value={formData.loyalty_points_expiration_months || ""} onChange={e => setFormData({
              ...formData,
              loyalty_points_expiration_months: parseInt(e.target.value) || 0
            })} placeholder="12" />
              <p className="text-xs text-muted-foreground">
                Clientes receberão notificação 30 dias antes dos pontos expirarem. 
                Deixe em branco para pontos sem expiração.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bot WhatsApp - Apenas para Profissional e Elite */}
        {(plan === "profissional" || plan === "elite") && (
          <Card variant="elevated" className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-gold" />
                Atendimento Automático via WhatsApp
              </CardTitle>
              <CardDescription>
                Ative o bot para permitir que seus clientes agendem diretamente pelo WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Ativar Bot de Agendamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, o bot responderá automaticamente às mensagens 
                    recebidas no WhatsApp conectado, permitindo agendamentos 24h.
                  </p>
                </div>
                <Switch
                  checked={formData.whatsapp_bot_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, whatsapp_bot_enabled: checked })
                  }
                />
              </div>
              
              {formData.whatsapp_bot_enabled && !isWapiConfigured && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ Configure e conecte o WhatsApp abaixo para o bot funcionar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card variant="elevated" className="mt-6" id="whatsapp-connect-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold" />
              Integração WhatsApp
              {isWapiConfigured && <span className={`ml-2 px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${connectionStatus === "connected" ? "bg-green-500/20 text-green-500" : connectionStatus === "loading" || checkingStatus ? "bg-yellow-500/20 text-yellow-500" : "bg-red-500/20 text-red-500"}`}>
                  {connectionStatus === "connected" ? <><Wifi className="w-3 h-3" /> Conectado</> : connectionStatus === "loading" || checkingStatus ? <><Loader2 className="w-3 h-3 animate-spin" /> Verificando</> : <><WifiOff className="w-3 h-3" /> Desconectado</>}
                </span>}
            </CardTitle>
            <CardDescription>Configure sua conta para enviar mensagens automáticas de confirmação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">ID da Instância</p>
              <code className="text-sm font-mono bg-background px-3 py-2 rounded block">
                {formData.wapi_instance_id || "Configure o slug primeiro"}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                O ID é gerado automaticamente com base no slug da sua barbearia
              </p>
            </div>

            {isWapiConfigured && <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  {connectionStatus === "connected" ? "WhatsApp conectado! Você pode testar ou desconectar." : "Conecte seu WhatsApp escaneando o QR Code"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {connectionStatus !== "connected" ? (
                    <Button type="button" variant="outline" className="gap-2" onClick={fetchQrCode} disabled={loadingQr} id="whatsapp-connect-btn">
                      {loadingQr ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                      Conectar WhatsApp
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" className="gap-2" disabled={disconnecting}>
                          {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                          Desconectar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja desconectar o WhatsApp? O atendimento automático e os lembretes via WhatsApp serão desativados até você conectar novamente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDisconnect} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Sim, desconectar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button type="button" variant="outline" className="gap-2" onClick={handleTestWhatsApp} disabled={testingWhatsApp || connectionStatus !== "connected"}>
                    {testingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Testar WhatsApp
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={checkInstanceStatus} disabled={checkingStatus} title="Verificar conexão">
                    {checkingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  </Button>
                </div>
              </div>}

          </CardContent>
        </Card>

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-gold" />
                Conectar WhatsApp
              </DialogTitle>
              <DialogDescription>
                Escaneie o QR Code com seu WhatsApp para conectar
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6">
              {loadingQr ? <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-gold" />
                  <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                </div> : qrCodeImage ? <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <img src={qrCodeImage} alt="QR Code WhatsApp" className="w-64 h-64" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Abra o WhatsApp no celular → Menu (⋮) → Aparelhos conectados → Conectar um aparelho
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    {checkingStatus ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando conexão...</> : connectionStatus === "connected" ? <span className="text-green-500 flex items-center gap-1">
                        <Wifi className="w-4 h-4" /> Conectado!
                      </span> : <span className="text-muted-foreground flex items-center gap-1">
                        <WifiOff className="w-4 h-4" /> Aguardando conexão...
                      </span>}
                  </div>
                </div> : <p className="text-sm text-muted-foreground">Erro ao carregar QR Code</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
                Fechar
              </Button>
              {qrCodeImage && <Button onClick={fetchQrCode} disabled={loadingQr} className="bg-gold hover:bg-gold/90">
                  Gerar Novo QR Code
                </Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end mt-6">
          <Button type="submit" className="bg-gold hover:bg-gold/90" disabled={saving || !!slugError}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>;
}