import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, QrCode, CreditCard, Copy, Check, AlertCircle } from "lucide-react";
import { SubscriptionPlan } from "@/hooks/useSubscription";
import { useQueryClient } from "@tanstack/react-query";

const MERCADOPAGO_PUBLIC_KEY = "APP_USR-750e65d0-aa7f-41d7-b3e7-914407072252";

// Load Mercado Pago SDK dynamically
const loadMercadoPagoSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) {
      resolve();
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Mercado Pago SDK"));
    document.head.appendChild(script);
  });
};

interface TransparentCheckoutProps {
  planId: SubscriptionPlan;
  planName: string;
  planPrice: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PixData {
  qrCode: string;
  qrCodeText: string;
  paymentId: number;
}

export function TransparentCheckout({ 
  planId, 
  planName, 
  planPrice, 
  onSuccess,
  onCancel 
}: TransparentCheckoutProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pix" | "card">("pix");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const sdkLoadAttempted = useRef(false);

  // Load SDK on mount
  useEffect(() => {
    if (sdkLoadAttempted.current) return;
    sdkLoadAttempted.current = true;
    
    loadMercadoPagoSDK()
      .then(() => setSdkLoaded(true))
      .catch((err) => console.error("Error loading MP SDK:", err));
  }, []);
  
  // PIX form
  const [pixCpf, setPixCpf] = useState("");
  const [pixFirstName, setPixFirstName] = useState("");
  const [pixLastName, setPixLastName] = useState("");
  
  // Card form
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardCpf, setCardCpf] = useState("");
  const [cardError, setCardError] = useState("");

  // Polling for PIX payment confirmation
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (pixData && isPolling) {
      pollInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase.functions.invoke("check-payment-status", {
            body: { paymentId: pixData.paymentId },
          });
          
          if (error) {
            console.error("Polling error:", error);
            return;
          }
          
          if (data?.status === "approved") {
            setIsPolling(false);
            queryClient.invalidateQueries({ queryKey: ["shop"] });
            toast.success("Pagamento confirmado! Seu plano foi ativado.");
            onSuccess();
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 5000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pixData, isPolling, queryClient, onSuccess]);

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 16);
    return numbers.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 4);
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + "/" + numbers.slice(2);
    }
    return numbers;
  };

  const validateCpf = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[10])) return false;
    
    return true;
  };

  const handleGeneratePix = async () => {
    const cpfNumbers = pixCpf.replace(/\D/g, "");
    
    if (!validateCpf(cpfNumbers)) {
      toast.error("CPF inválido");
      return;
    }
    
    if (!pixFirstName.trim() || !pixLastName.trim()) {
      toast.error("Preencha seu nome completo");
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          planId,
          paymentMethod: "pix",
          payer: {
            firstName: pixFirstName.trim(),
            lastName: pixLastName.trim(),
            cpf: cpfNumbers,
          },
        },
      });
      
      if (error) throw error;
      
      if (data?.status === "pending" && data?.pix) {
        setPixData({
          qrCode: data.pix.qrCode,
          qrCodeText: data.pix.qrCodeText,
          paymentId: data.paymentId,
        });
        setIsPolling(true);
        toast.success("PIX gerado! Escaneie o QR Code ou copie o código.");
      } else {
        throw new Error("Erro ao gerar PIX");
      }
    } catch (error) {
      console.error("PIX error:", error);
      toast.error("Erro ao gerar PIX. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPix = async () => {
    if (pixData?.qrCodeText) {
      await navigator.clipboard.writeText(pixData.qrCodeText);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePayCard = async () => {
    setCardError("");
    
    const cpfNumbers = cardCpf.replace(/\D/g, "");
    if (!validateCpf(cpfNumbers)) {
      setCardError("CPF inválido");
      return;
    }
    
    const cardNumbers = cardNumber.replace(/\D/g, "");
    if (cardNumbers.length < 13 || cardNumbers.length > 19) {
      setCardError("Número do cartão inválido");
      return;
    }
    
    if (!cardName.trim()) {
      setCardError("Preencha o nome no cartão");
      return;
    }
    
    const [month, year] = cardExpiry.split("/");
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setCardError("Validade inválida");
      return;
    }
    
    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) {
      setCardError("Mês inválido");
      return;
    }
    
    if (cardCvv.length < 3 || cardCvv.length > 4) {
      setCardError("CVV inválido");
      return;
    }
    
    setIsLoading(true);
    try {
      // Ensure SDK is loaded
      if (!sdkLoaded || !window.MercadoPago) {
        await loadMercadoPagoSDK();
        setSdkLoaded(true);
      }
      
      const mp = new window.MercadoPago(MERCADOPAGO_PUBLIC_KEY, { locale: "pt-BR" });
      
      // Create card token
      const tokenResponse = await mp.createCardToken({
        cardNumber: cardNumbers,
        cardholderName: cardName.trim().toUpperCase(),
        cardExpirationMonth: month,
        cardExpirationYear: "20" + year,
        securityCode: cardCvv,
        identificationType: "CPF",
        identificationNumber: cpfNumbers,
      });
      
      if (!tokenResponse?.id) {
        throw new Error("Erro ao tokenizar cartão");
      }
      
      // Process payment
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          planId,
          paymentMethod: "credit_card",
          cardToken: tokenResponse.id,
          payer: {
            cpf: cpfNumbers,
          },
        },
      });
      
      if (error) throw error;
      
      if (data?.status === "approved") {
        queryClient.invalidateQueries({ queryKey: ["shop"] });
        toast.success("Pagamento aprovado! Seu plano foi ativado.");
        onSuccess();
      } else if (data?.status === "rejected" || data?.status === "cancelled") {
        setCardError(data?.statusDetail || "Pagamento recusado. Verifique os dados do cartão.");
      } else if (data?.status === "in_process" || data?.status === "pending") {
        toast.info("Pagamento em análise. Você será notificado quando for aprovado.");
        onSuccess();
      } else {
        throw new Error("Status de pagamento desconhecido");
      }
    } catch (error: any) {
      console.error("Card payment error:", error);
      setCardError(error?.message || "Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Plano {planName}</span>
          <span className="font-bold text-foreground text-xl">R$ {planPrice},00</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Pagamento único à vista</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pix" | "card")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pix" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            PIX
          </TabsTrigger>
          <TabsTrigger value="card" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Cartão de Crédito
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pix" className="space-y-4 mt-4">
          {!pixData ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pix-first-name">Nome</Label>
                  <Input
                    id="pix-first-name"
                    placeholder="João"
                    value={pixFirstName}
                    onChange={(e) => setPixFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pix-last-name">Sobrenome</Label>
                  <Input
                    id="pix-last-name"
                    placeholder="Silva"
                    value={pixLastName}
                    onChange={(e) => setPixLastName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pix-cpf">CPF</Label>
                <Input
                  id="pix-cpf"
                  placeholder="000.000.000-00"
                  value={pixCpf}
                  onChange={(e) => setPixCpf(formatCpf(e.target.value))}
                  maxLength={14}
                />
              </div>
              
              <Button 
                onClick={handleGeneratePix} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Gerar PIX
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4 text-center">
              <div className="bg-white p-4 rounded-lg inline-block mx-auto">
                <img 
                  src={`data:image/png;base64,${pixData.qrCode}`} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Ou copie o código PIX:</p>
                <div className="flex items-center gap-2">
                  <Input 
                    value={pixData.qrCodeText} 
                    readOnly 
                    className="text-xs font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleCopyPix}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
              
              <p className="text-xs text-muted-foreground">
                O pagamento será confirmado automaticamente após o PIX.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="card" className="space-y-4 mt-4">
          {cardError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {cardError}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="card-number">Número do cartão</Label>
            <Input
              id="card-number"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              maxLength={19}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="card-name">Nome impresso no cartão</Label>
            <Input
              id="card-name"
              placeholder="JOÃO SILVA"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="card-expiry">Validade</Label>
              <Input
                id="card-expiry"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-cvv">CVV</Label>
              <Input
                id="card-cvv"
                placeholder="123"
                type="password"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="card-cpf">CPF do titular</Label>
            <Input
              id="card-cpf"
              placeholder="000.000.000-00"
              value={cardCpf}
              onChange={(e) => setCardCpf(formatCpf(e.target.value))}
              maxLength={14}
            />
          </div>
          
          <Button 
            onClick={handlePayCard} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar R$ {planPrice},00
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between pt-2 border-t">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <p className="text-xs text-muted-foreground">
          🔒 Pagamento seguro via Mercado Pago
        </p>
      </div>
    </div>
  );
}
