import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicShopBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-shop", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function usePublicServices(shopId: string | undefined) {
  return useQuery({
    queryKey: ["public-services", shopId],
    queryFn: async () => {
      if (!shopId) return [];

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("shop_id", shopId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });
}

export function usePublicBarbers(shopId: string | undefined) {
  return useQuery({
    queryKey: ["public-barbers", shopId],
    queryFn: async () => {
      if (!shopId) return [];

      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .eq("shop_id", shopId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });
}

// Buscar barbeiros filtrados por serviço (retro-compatível)
export function usePublicBarbersForService(shopId: string | undefined, serviceId: string | undefined) {
  const { data: allBarbers = [], isLoading: barbersLoading } = usePublicBarbers(shopId);
  
  const { data: barberServiceIds = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["public-barber-services", serviceId],
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

  // Se não há vínculos configurados para este serviço, retorna todos os barbeiros
  // (retrocompatibilidade: barbearias que não configuraram serviços por barbeiro)
  const filteredBarbers = barberServiceIds.length > 0
    ? allBarbers.filter((barber) => barberServiceIds.includes(barber.id))
    : allBarbers;

  return {
    data: filteredBarbers,
    isLoading: barbersLoading || servicesLoading,
  };
}

export function useBarberWorkingHours(barberId: string | undefined) {
  return useQuery({
    queryKey: ["working-hours", barberId],
    queryFn: async () => {
      if (!barberId) return [];

      const { data, error } = await supabase
        .from("working_hours")
        .select("*")
        .eq("barber_id", barberId)
        .eq("is_active", true)
        .order("day_of_week");

      if (error) throw error;
      return data;
    },
    enabled: !!barberId,
  });
}

export function useBarberAppointments(barberId: string | undefined, date: Date | undefined) {
  return useQuery({
    queryKey: ["barber-appointments", barberId, date?.toISOString()],
    queryFn: async () => {
      if (!barberId || !date) return [];

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("appointments")
        .select("start_time, end_time")
        .eq("barber_id", barberId)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .neq("status", "cancelled");

      if (error) throw error;
      return data;
    },
    enabled: !!barberId && !!date,
  });
}

export function useBarberBlockedTimes(barberId: string | undefined, date: Date | undefined) {
  return useQuery({
    queryKey: ["barber-blocked-times", barberId, date?.toISOString()],
    queryFn: async () => {
      if (!barberId || !date) return [];

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("blocked_times")
        .select("start_time, end_time")
        .eq("barber_id", barberId)
        .gte("end_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!barberId && !!date,
  });
}
