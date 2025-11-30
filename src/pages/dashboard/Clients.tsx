import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/hooks/useShop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle, Phone, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientStats {
  client_name: string;
  client_phone: string | null;
  total_appointments: number;
  total_spent: number;
  last_visit: string;
}

export default function Clients() {
  const { data: shop } = useShop();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", shop?.id],
    queryFn: async () => {
      if (!shop) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("client_name, client_phone, start_time, service:services(price)")
        .eq("shop_id", shop.id)
        .eq("status", "completed")
        .not("client_name", "is", null)
        .order("start_time", { ascending: false });

      if (error) throw error;

      // Aggregate by client name
      const clientMap = new Map<string, ClientStats>();
      
      data?.forEach((apt) => {
        const name = apt.client_name || "Cliente";
        const existing = clientMap.get(name);
        const price = (apt.service as { price: number } | null)?.price || 0;
        
        if (existing) {
          existing.total_appointments += 1;
          existing.total_spent += price;
          if (new Date(apt.start_time) > new Date(existing.last_visit)) {
            existing.last_visit = apt.start_time;
          }
          if (apt.client_phone && !existing.client_phone) {
            existing.client_phone = apt.client_phone;
          }
        } else {
          clientMap.set(name, {
            client_name: name,
            client_phone: apt.client_phone,
            total_appointments: 1,
            total_spent: price,
            last_visit: apt.start_time,
          });
        }
      });

      return Array.from(clientMap.values()).sort((a, b) => 
        new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime()
      );
    },
    enabled: !!shop,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Clientes</h1>
        <p className="text-muted-foreground">Histórico de clientes que já agendaram na sua barbearia</p>
      </div>

      {clients.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="py-12 text-center">
            <UserCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Nenhum cliente ainda</p>
            <p className="text-sm text-muted-foreground">
              Os clientes aparecerão aqui após completarem agendamentos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client, index) => (
            <Card key={index} variant="elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gold/20 text-gold font-medium">
                      {getInitials(client.client_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{client.client_name}</CardTitle>
                    {client.client_phone && (
                      <CardDescription className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.client_phone}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{client.total_appointments}</p>
                      <p className="text-xs text-muted-foreground">Visitas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gold" />
                    <div>
                      <p className="font-medium text-foreground">R$ {client.total_spent.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Total gasto</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Última visita: {format(new Date(client.last_visit), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
