import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Send } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminBilling() {
  const { data: expiringTrials, isLoading: loadingTrials } = useQuery({
    queryKey: ["admin-expiring-trials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("subscription_status", "trial")
        .not("trial_ends_at", "is", null)
        .lte("trial_ends_at", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("trial_ends_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: pastDue, isLoading: loadingPastDue } = useQuery({
    queryKey: ["admin-past-due"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("subscription_status", "past_due")
        .order("updated_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: cancelled, isLoading: loadingCancelled } = useQuery({
    queryKey: ["admin-cancelled"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("subscription_status", "cancelled")
        .gte("updated_at", thirtyDaysAgo)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSendReminder = async (shopId: string) => {
    try {
      const { error } = await supabase.functions.invoke("send-billing-reminder", {
        body: { shop_id: shopId },
      });

      if (error) throw error;
      toast.success("Lembrete enviado com sucesso");
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Erro ao enviar lembrete");
    }
  };

  const getDaysRemaining = (trialEndsAt: string) => {
    const days = differenceInDays(new Date(trialEndsAt), new Date());
    if (days < 0) return "Expirado";
    if (days === 0) return "Hoje";
    if (days === 1) return "1 dia";
    return `${days} dias`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pendências e Cobranças</h1>
        <p className="text-muted-foreground">Gerencie pagamentos e trials expirando</p>
      </div>

      {/* Trials Expirando */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Trials Expirando ({expiringTrials?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTrials ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : expiringTrials && expiringTrials.length > 0 ? (
            <div className="space-y-3">
              {expiringTrials.map((shop) => (
                <Alert key={shop.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{shop.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Expira em: {getDaysRemaining(shop.trial_ends_at!)} (
                        {format(new Date(shop.trial_ends_at!), "dd/MM/yyyy", { locale: ptBR })})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{shop.plan}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendReminder(shop.id)}
                        disabled={!shop.wapi_instance_id}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Lembrete
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum trial expirando nos próximos 7 dias</p>
          )}
        </CardContent>
      </Card>

      {/* Pagamentos Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Pagamentos Pendentes ({pastDue?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPastDue ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : pastDue && pastDue.length > 0 ? (
            <div className="space-y-3">
              {pastDue.map((shop) => (
                <Alert key={shop.id} variant="destructive">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{shop.name}</div>
                      <div className="text-sm">
                        Última atualização:{" "}
                        {format(new Date(shop.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{shop.plan}</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleSendReminder(shop.id)}
                        disabled={!shop.wapi_instance_id}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Lembrete
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum pagamento pendente</p>
          )}
        </CardContent>
      </Card>

      {/* Canceladas Recentemente */}
      <Card>
        <CardHeader>
          <CardTitle>Canceladas Recentemente ({cancelled?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCancelled ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : cancelled && cancelled.length > 0 ? (
            <div className="space-y-3">
              {cancelled.map((shop) => (
                <div key={shop.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{shop.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Cancelado em:{" "}
                      {format(new Date(shop.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                  <Badge variant="outline">{shop.plan}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma barbearia cancelada nos últimos 30 dias
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
