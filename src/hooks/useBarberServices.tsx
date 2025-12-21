import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BarberService {
  id: string;
  barber_id: string;
  service_id: string;
  created_at: string;
}

// Hook para buscar serviços de um barbeiro
export function useBarberServices(barberId: string | undefined) {
  return useQuery({
    queryKey: ["barber-services", barberId],
    queryFn: async () => {
      if (!barberId) return [];

      const { data, error } = await supabase
        .from("barber_services")
        .select("service_id")
        .eq("barber_id", barberId);

      if (error) throw error;
      return data.map((d) => d.service_id);
    },
    enabled: !!barberId,
  });
}

// Hook para atualizar serviços de um barbeiro
export function useUpdateBarberServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      barberId,
      serviceIds,
    }: {
      barberId: string;
      serviceIds: string[];
    }) => {
      // Deletar todos os vínculos existentes
      const { error: deleteError } = await supabase
        .from("barber_services")
        .delete()
        .eq("barber_id", barberId);

      if (deleteError) throw deleteError;

      // Inserir novos vínculos (se houver)
      if (serviceIds.length > 0) {
        const inserts = serviceIds.map((serviceId) => ({
          barber_id: barberId,
          service_id: serviceId,
        }));

        const { error: insertError } = await supabase
          .from("barber_services")
          .insert(inserts);

        if (insertError) throw insertError;
      }

      return serviceIds;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["barber-services", variables.barberId] });
      queryClient.invalidateQueries({ queryKey: ["barber-services-count"] });
      toast.success("Serviços atualizados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar serviços: " + error.message);
    },
  });
}

// Hook para buscar barbeiros que fazem um serviço específico
export function useBarbersForService(serviceId: string | undefined, allBarbers: any[]) {
  const { data: barberServices = [], isLoading } = useQuery({
    queryKey: ["barbers-for-service", serviceId],
    queryFn: async () => {
      if (!serviceId) return [];

      const { data, error } = await supabase
        .from("barber_services")
        .select("barber_id")
        .eq("service_id", serviceId);

      if (error) throw error;
      return data.map((d) => d.barber_id);
    },
    enabled: !!serviceId,
  });

  // Filtrar barbeiros: se tem vínculos, apenas os vinculados ao serviço
  // Se não tem vínculos (retro-compatibilidade), retorna todos
  const filteredBarbers = allBarbers.filter((barber) => {
    // Se não há vínculos na tabela para este serviço, retorna todos os barbeiros
    if (barberServices.length === 0) return true;
    return barberServices.includes(barber.id);
  });

  return { data: filteredBarbers, isLoading };
}

// Hook para contar serviços de um barbeiro
export function useBarberServicesCount(barberId: string | undefined) {
  return useQuery({
    queryKey: ["barber-services-count", barberId],
    queryFn: async () => {
      if (!barberId) return 0;

      const { count, error } = await supabase
        .from("barber_services")
        .select("id", { count: "exact", head: true })
        .eq("barber_id", barberId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!barberId,
  });
}
