import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2, CheckCircle, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Client {
  client_name: string;
  client_phone: string | null;
}

interface ReturnCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  filterType: "all" | "maintenance" | "late" | "missing";
  shopId: string;
  shopName: string;
}

const MESSAGE_TEMPLATES = {
  all: `Fala [Nome]! 💈 Passando pra lembrar que estamos aqui na [Barbearia] sempre prontos pra deixar seu visual impecável! Manda um oi para agendar. 👊`,
  maintenance: `Fala [Nome]! 💈 O sistema me avisou que seu último corte foi há 20 dias. O visual deve estar começando a perder a forma. Bora garantir o horário da semana antes que lote? 👊 Mande um oi para agendar.`,
  late: `[Nome], faz mais de 30 dias que a gente não se vê! Nada melhor que a sensação de cabelo cortado e barba feita, né? 🥃 Bora agendar aquele momento de resenha e trato no visual? Tô te esperando.`,
  missing: `Fala [Nome]! Sumiu, parceiro? 💈 A cadeira tá sentindo sua falta aqui na [Barbearia]. Bora retomar o visual de respeito? Manda um oi que a gente acha um horário especial pra você.`,
};

const FILTER_LABELS = {
  all: "Todos",
  maintenance: "Manutenção",
  late: "Atrasados",
  missing: "Sumidos",
};

export function ReturnCampaignDialog({
  open,
  onOpenChange,
  clients,
  filterType,
  shopId,
  shopName,
}: ReturnCampaignDialogProps) {
  const [message, setMessage] = useState(
    MESSAGE_TEMPLATES[filterType].replace("[Barbearia]", shopName)
  );
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const clientsWithPhone = clients.filter((c) => c.client_phone);

  const handleSend = async () => {
    if (clientsWithPhone.length === 0) {
      toast.error("Nenhum cliente selecionado possui telefone cadastrado");
      return;
    }

    setIsSending(true);
    setProgress(0);
    setSentCount(0);
    setFailedCount(0);

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < clientsWithPhone.length; i++) {
      const client = clientsWithPhone[i];
      const personalizedMessage = message.replace(
        /\[Nome\]/g,
        client.client_name.split(" ")[0]
      );

      try {
        const { error } = await supabase.functions.invoke("send-whatsapp", {
          body: {
            shopId,
            phone: client.client_phone,
            customMessage: personalizedMessage,
          },
        });

        if (error) {
          console.error(`Error sending to ${client.client_name}:`, error);
          failed++;
        } else {
          sent++;
        }
      } catch (err) {
        console.error(`Error sending to ${client.client_name}:`, err);
        failed++;
      }

      setSentCount(sent);
      setFailedCount(failed);
      setProgress(((i + 1) / clientsWithPhone.length) * 100);

      // Wait 10 seconds between messages (except for the last one)
      if (i < clientsWithPhone.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    setIsSending(false);

    if (failed === 0) {
      toast.success(`${sent} mensagens enviadas com sucesso!`);
      onOpenChange(false);
    } else {
      toast.warning(`${sent} enviadas, ${failed} falharam`);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessage(MESSAGE_TEMPLATES[filterType].replace("[Barbearia]", shopName));
      setProgress(0);
      setSentCount(0);
      setFailedCount(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-green-500" />
            Campanha de Retorno - {FILTER_LABELS[filterType]}
          </DialogTitle>
          <DialogDescription>
            Enviar mensagem para {clientsWithPhone.length} cliente(s) via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>{clientsWithPhone.length}</strong> clientes com telefone cadastrado
              {clients.length !== clientsWithPhone.length && (
                <span className="text-muted-foreground ml-1">
                  ({clients.length - clientsWithPhone.length} sem telefone)
                </span>
              )}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="min-h-[150px] resize-none"
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">
              Use <code className="px-1 py-0.5 rounded bg-muted">[Nome]</code> para personalizar com o nome do cliente
            </p>
          </div>

          {isSending && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando mensagens...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  {sentCount} enviadas
                </div>
                {failedCount > 0 && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {failedCount} falharam
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                ⏱️ Intervalo de 10 segundos entre cada mensagem para evitar bloqueio
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || clientsWithPhone.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar para {clientsWithPhone.length} clientes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
