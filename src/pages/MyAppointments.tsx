import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Calendar, Clock, User, Scissors, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  no_show: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export default function MyAppointments() {
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["client-appointments", searchPhone],
    queryFn: async () => {
      if (!searchPhone) return [];

      const cleanPhone = searchPhone.replace(/\D/g, "");
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          barber:barbers(name),
          service:services(name, price, duration_minutes),
          shop:shops(name)
        `)
        .eq("client_phone", cleanPhone)
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!searchPhone,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      toast.success("Agendamento cancelado com sucesso");
      setCancelId(null);
    },
    onError: () => {
      toast.error("Erro ao cancelar agendamento");
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Digite um telefone válido com DDD");
      return;
    }
    setSearchPhone(cleanPhone);
  };

  const canCancel = (appointment: any) => {
    return (
      !isPast(parseISO(appointment.start_time)) &&
      !["cancelled", "completed", "no_show"].includes(appointment.status)
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meus Agendamentos</h1>
          <p className="text-muted-foreground">
            Digite seu telefone para ver seus agendamentos
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="flex-1"
                maxLength={15}
              />
              <Button type="submit" disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-pulse text-muted-foreground">Buscando...</div>
          </div>
        )}

        {searchPhone && !isLoading && appointments?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Nenhum agendamento encontrado para este telefone
              </p>
            </CardContent>
          </Card>
        )}

        {appointments && appointments.length > 0 && (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {appointment.shop?.name}
                      </CardTitle>
                      <CardDescription>
                        {appointment.service?.name}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(parseISO(appointment.start_time), "dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(parseISO(appointment.start_time), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{appointment.barber?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Scissors className="w-4 h-4" />
                      <span>
                        {appointment.service?.price
                          ? `R$ ${Number(appointment.service.price).toFixed(2)}`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {canCancel(appointment) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => setCancelId(appointment.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar agendamento
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Não, manter</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => cancelId && cancelMutation.mutate(cancelId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sim, cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
