import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BarberStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
}

export function useBarberStats(barberId: string | undefined) {
  return useQuery({
    queryKey: ["barber-stats", barberId],
    queryFn: async () => {
      if (!barberId) return null;

      // Get appointments stats
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("status, service:services(price)")
        .eq("barber_id", barberId);

      if (appointmentsError) throw appointmentsError;

      // Get reviews stats
      const { data: reviews, error: reviewsError } = await supabase
        .from("barber_reviews")
        .select("rating")
        .eq("barber_id", barberId);

      if (reviewsError) throw reviewsError;

      const totalAppointments = appointments?.length || 0;
      const completedAppointments = appointments?.filter(a => a.status === "completed").length || 0;
      const cancelledAppointments = appointments?.filter(a => a.status === "cancelled").length || 0;
      const noShowAppointments = appointments?.filter(a => a.status === "no_show").length || 0;

      const totalRevenue = appointments
        ?.filter(a => a.status === "completed")
        .reduce((sum, a) => sum + (Number(a.service?.price) || 0), 0) || 0;

      const totalReviews = reviews?.length || 0;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      const completionRate = totalAppointments > 0
        ? (completedAppointments / totalAppointments) * 100
        : 0;

      return {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        totalRevenue,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
        completionRate: Number(completionRate.toFixed(1)),
      } as BarberStats;
    },
    enabled: !!barberId,
  });
}
