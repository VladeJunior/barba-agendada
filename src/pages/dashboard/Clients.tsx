import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/hooks/useShop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCircle, Phone, Calendar, DollarSign, Send, Check } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReturnCampaignDialog } from "@/components/dashboard/ReturnCampaignDialog";

interface ClientStats {
  client_name: string;
  client_phone: string | null;
  total_appointments: number;
  total_spent: number;
  last_visit: string;
  days_since_visit: number;
}

type FilterType = "all" | "maintenance" | "late" | "missing";

export default function Clients() {
  const { data: shop } = useShop();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);

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
      const now = new Date();
      
      data?.forEach((apt) => {
        const name = apt.client_name || "Cliente";
        const existing = clientMap.get(name);
        const price = (apt.service as { price: number } | null)?.price || 0;
        
        if (existing) {
          existing.total_appointments += 1;
          existing.total_spent += price;
          if (new Date(apt.start_time) > new Date(existing.last_visit)) {
            existing.last_visit = apt.start_time;
            existing.days_since_visit = differenceInDays(now, new Date(apt.start_time));
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
            days_since_visit: differenceInDays(now, new Date(apt.start_time)),
          });
        }
      });

      return Array.from(clientMap.values()).sort((a, b) => 
        new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime()
      );
    },
    enabled: !!shop,
  });

  const filteredClients = useMemo(() => {
    switch (filter) {
      case "maintenance":
        return clients.filter((c) => c.days_since_visit >= 20 && c.days_since_visit < 30);
      case "late":
        return clients.filter((c) => c.days_since_visit >= 30 && c.days_since_visit < 45);
      case "missing":
        return clients.filter((c) => c.days_since_visit >= 45);
      default:
        return clients;
    }
  }, [clients, filter]);

  const filterCounts = useMemo(() => ({
    all: clients.length,
    maintenance: clients.filter((c) => c.days_since_visit >= 20 && c.days_since_visit < 30).length,
    late: clients.filter((c) => c.days_since_visit >= 30 && c.days_since_visit < 45).length,
    missing: clients.filter((c) => c.days_since_visit >= 45).length,
  }), [clients]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (days: number) => {
    if (days >= 45) {
      return <Badge variant="destructive" className="text-xs">Sumido (+45 dias)</Badge>;
    }
    if (days >= 30) {
      return <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">Atrasado ({days}d)</Badge>;
    }
    if (days >= 20) {
      return <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">Manutenção ({days}d)</Badge>;
    }
    return null;
  };

  const toggleSelectClient = (clientName: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientName)) {
      newSelected.delete(clientName);
    } else {
      newSelected.add(clientName);
    }
    setSelectedClients(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.client_name)));
    }
  };

  const selectedClientsData = useMemo(() => 
    filteredClients.filter((c) => selectedClients.has(c.client_name)),
    [filteredClients, selectedClients]
  );

  // Reset selection when filter changes
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setSelectedClients(new Set());
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Histórico de clientes e campanhas de retorno</p>
        </div>
        {selectedClients.size > 0 && (
          <Button
            onClick={() => setShowCampaignDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Convite WhatsApp ({selectedClients.size})
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => handleFilterChange(v as FilterType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Todos ({filterCounts.all})
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">Manutenção</span>
            <span className="sm:hidden">Manut.</span>
            <span className="ml-1">({filterCounts.maintenance})</span>
          </TabsTrigger>
          <TabsTrigger value="late" className="text-xs sm:text-sm">
            Atrasados ({filterCounts.late})
          </TabsTrigger>
          <TabsTrigger value="missing" className="text-xs sm:text-sm">
            Sumidos ({filterCounts.missing})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredClients.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Checkbox
            id="select-all"
            checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <label htmlFor="select-all" className="text-sm cursor-pointer">
            {selectedClients.size === filteredClients.length
              ? "Desmarcar todos"
              : `Selecionar todos (${filteredClients.length})`}
          </label>
        </div>
      )}

      {filteredClients.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="py-12 text-center">
            <UserCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {filter === "all"
                ? "Nenhum cliente ainda"
                : `Nenhum cliente na categoria "${filter === "maintenance" ? "Manutenção" : filter === "late" ? "Atrasados" : "Sumidos"}"`}
            </p>
            {filter === "all" && (
              <p className="text-sm text-muted-foreground">
                Os clientes aparecerão aqui após completarem agendamentos
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client, index) => (
            <Card 
              key={index} 
              variant="elevated"
              className={`transition-all ${
                selectedClients.has(client.client_name) 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedClients.has(client.client_name)}
                    onCheckedChange={() => toggleSelectClient(client.client_name)}
                    className="mt-1"
                  />
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gold/20 text-gold font-medium">
                      {getInitials(client.client_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg truncate">{client.client_name}</CardTitle>
                      {selectedClients.has(client.client_name) && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                    {client.client_phone && (
                      <CardDescription className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {client.client_phone}
                      </CardDescription>
                    )}
                    {getStatusBadge(client.days_since_visit)}
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

      {shop && (
        <ReturnCampaignDialog
          open={showCampaignDialog}
          onOpenChange={setShowCampaignDialog}
          clients={selectedClientsData}
          filterType={filter}
          shopId={shop.id}
          shopName={shop.name}
        />
      )}
    </div>
  );
}
