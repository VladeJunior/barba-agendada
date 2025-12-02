import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "America/Sao_Paulo";
const SAO_PAULO_OFFSET = "-03:00"; // Brazil doesn't observe DST since 2019

export interface Appointment {
  id: string;
  shop_id: string;
  barber_id: string;
  client_id: string | null;
  service_id: string;
  client_name: string | null;
  client_phone: string | null;
  start_time: string;
  end_time: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  payment_status: "pending" | "paid" | "refunded";
  notes: string | null;
  created_at: string;
  updated_at: string;
  coupon_id: string | null;
  discount_amount: number | null;
  original_price: number | null;
  final_price: number | null;
  barber?: { name: string };
  service?: { name: string; price: number; duration_minutes: number };
}

export interface AppointmentInput {
  barber_id: string;
  service_id: string;
  client_name?: string;
  client_phone?: string;
  client_id?: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status?: Appointment["status"];
  payment_status?: Appointment["payment_status"];
}

export function useAppointments(date?: Date) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["appointments", shop?.id, date?.toISOString()],
    queryFn: async () => {
      if (!shop) return [];

      let query = supabase
        .from("appointments")
        .select("*, barber:barbers(name), service:services(name, price, duration_minutes)")
        .eq("shop_id", shop.id)
        .order("start_time");

      if (date) {
        // Get date string in São Paulo timezone
        const dateStr = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd');
        // Create UTC boundaries with explicit São Paulo offset
        const start = new Date(`${dateStr}T00:00:00${SAO_PAULO_OFFSET}`).toISOString();
        const end = new Date(`${dateStr}T23:59:59.999${SAO_PAULO_OFFSET}`).toISOString();
        query = query.gte("start_time", start).lte("start_time", end);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!shop,
  });
}

export function useWeekAppointments(date: Date) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["appointments", "week", shop?.id, format(date, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!shop) return [];

      // Get week boundaries in São Paulo timezone
      const dateStr = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd');
      const dateInSaoPaulo = new Date(`${dateStr}T12:00:00${SAO_PAULO_OFFSET}`);
      const weekStart = startOfWeek(dateInSaoPaulo, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(dateInSaoPaulo, { weekStartsOn: 0 });
      const start = formatInTimeZone(weekStart, TIMEZONE, "yyyy-MM-dd'T'00:00:00") + SAO_PAULO_OFFSET;
      const end = formatInTimeZone(weekEnd, TIMEZONE, "yyyy-MM-dd'T'23:59:59.999") + SAO_PAULO_OFFSET;
      const startISO = new Date(start).toISOString();
      const endISO = new Date(end).toISOString();

      const { data, error } = await supabase
        .from("appointments")
        .select("*, barber:barbers(name), service:services(name, price, duration_minutes)")
        .eq("shop_id", shop.id)
        .gte("start_time", startISO)
        .lte("start_time", endISO)
        .order("start_time");

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!shop,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      if (!shop) throw new Error("Shop not found");

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          shop_id: shop.id,
          status: 'confirmed' as const,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar agendamento: " + error.message);
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AppointmentInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" as const })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento cancelado!");
    },
    onError: (error) => {
      toast.error("Erro ao cancelar: " + error.message);
    },
  });
}
