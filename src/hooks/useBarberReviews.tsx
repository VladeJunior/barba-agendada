import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BarberReview {
  id: string;
  appointment_id: string;
  barber_id: string;
  client_id: string | null;
  client_phone: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewInput {
  appointment_id: string;
  barber_id: string;
  rating: number;
  comment?: string;
  client_phone?: string;
}

export function useBarberReviews(barberId: string | undefined) {
  return useQuery({
    queryKey: ["barber-reviews", barberId],
    queryFn: async () => {
      if (!barberId) return [];

      const { data, error } = await supabase
        .from("barber_reviews")
        .select("*")
        .eq("barber_id", barberId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BarberReview[];
    },
    enabled: !!barberId,
  });
}

export function useBarberAverageRating(barberId: string | undefined) {
  return useQuery({
    queryKey: ["barber-average-rating", barberId],
    queryFn: async () => {
      if (!barberId) return { average: 0, count: 0 };

      const { data, error } = await supabase
        .from("barber_reviews")
        .select("rating")
        .eq("barber_id", barberId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { average: 0, count: 0 };
      }

      const sum = data.reduce((acc, review) => acc + review.rating, 0);
      const average = sum / data.length;

      return { average: Number(average.toFixed(1)), count: data.length };
    },
    enabled: !!barberId,
  });
}

export function useAppointmentReview(appointmentId: string | undefined) {
  return useQuery({
    queryKey: ["appointment-review", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;

      const { data, error } = await supabase
        .from("barber_reviews")
        .select("*")
        .eq("appointment_id", appointmentId)
        .maybeSingle();

      if (error) throw error;
      return data as BarberReview | null;
    },
    enabled: !!appointmentId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      const { data, error } = await supabase
        .from("barber_reviews")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["barber-reviews", variables.barber_id] });
      queryClient.invalidateQueries({ queryKey: ["barber-average-rating", variables.barber_id] });
      queryClient.invalidateQueries({ queryKey: ["appointment-review", variables.appointment_id] });
      toast.success("Avaliação enviada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao enviar avaliação: " + error.message);
    },
  });
}
