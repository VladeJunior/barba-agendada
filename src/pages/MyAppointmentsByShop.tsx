import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Scissors, Phone, AlertCircle, X, Home, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePublicShopBySlug } from "@/hooks/usePublicShop";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não Compareceu",
};

const statusColors = {
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
  completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  no_show: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export default function MyAppointmentsByShop() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const [phone, setPhone] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);

  const { data: shop } = usePublicShopBySlug(shopSlug);

  const { data: appointments = [], refetch } = useQuery({
    queryKey: ["my-appointments-by-shop", phone, shop?.id],
    queryFn: async () => {
      if (!phone || !shop?.id) return [];

      const cleanPhone = phone.replace(/\D/g, "");
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          barbers (name),
          services (name, price, duration_minutes)
        `)
        .eq("shop_id", shop.id)
        .eq("client_phone", cleanPhone)
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const handleSearch = () => {
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Por favor, digite um telefone válido");
      return;
    }
    setSearchPerformed(true);
    refetch();
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success("Agendamento cancelado com sucesso");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao cancelar agendamento: " + error.message);
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status !== "cancelled" && apt.status !== "completed" && apt.status !== "no_show"
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === "cancelled" || apt.status === "completed" || apt.status === "no_show"
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {shop && shopSlug && (
              <Link to={`/agendar/${shopSlug}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            )}
            {shop?.logo_url && (
              <img 
                src={shop.logo_url} 
                alt={shop.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="font-semibold text-foreground">Meus Agendamentos</h1>
              {shop && <p className="text-sm text-muted-foreground">{shop.name}</p>}
            </div>
          </div>
          
          {/* Breadcrumb */}
          {shop && shopSlug && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
              <Link to={`/agendar/${shopSlug}`} className="hover:text-foreground transition-colors flex items-center gap-1">
                <Home className="h-4 w-4" />
                Agendar
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Meus Agendamentos</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Consultar Agendamentos</CardTitle>
            <CardDescription>
              Digite seu telefone para ver seus agendamentos{shop ? ` em ${shop.name}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>Buscar</Button>
              </div>
            </div>

            {searchPerformed && appointments.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum agendamento encontrado para este número.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {upcomingAppointments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Próximos Agendamentos</h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appointment.services?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{appointment.barbers?.name}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-md text-xs border ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                          {statusLabels[appointment.status as keyof typeof statusLabels]}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(appointment.start_time), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(appointment.start_time), "HH:mm")}</span>
                        </div>
                      </div>

                      {appointment.client_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{appointment.client_name}</span>
                        </div>
                      )}

                      {appointment.client_phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{appointment.client_phone}</span>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(appointment.id)}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar Agendamento
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pastAppointments.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Histórico</h2>
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <Card key={appointment.id} className="opacity-60">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appointment.services?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{appointment.barbers?.name}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-md text-xs border ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                          {statusLabels[appointment.status as keyof typeof statusLabels]}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(appointment.start_time), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(appointment.start_time), "HH:mm")}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
