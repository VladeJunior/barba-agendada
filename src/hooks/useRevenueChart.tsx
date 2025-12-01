import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  format
} from "date-fns";
import { PeriodType } from "./useDashboardMetrics";

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export function useRevenueChart(period: PeriodType, customRange?: DateRange) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["revenue-chart", shop?.id, period, customRange],
    queryFn: async () => {
      if (!shop) return [];

      const now = new Date();
      let start: Date;
      let end: Date;

      // Determine date range
      if (customRange?.from && customRange?.to) {
        start = startOfDay(customRange.from);
        end = endOfDay(customRange.to);
      } else {
        switch (period) {
          case "today":
            start = startOfDay(now);
            end = endOfDay(now);
            break;
          case "week":
            start = startOfWeek(now, { weekStartsOn: 0 });
            end = endOfWeek(now, { weekStartsOn: 0 });
            break;
          case "month":
            start = startOfMonth(now);
            end = endOfMonth(now);
            break;
        }
      }

      // Fetch appointments in the date range
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("id, start_time, status, service:services(price)")
        .eq("shop_id", shop.id)
        .eq("status", "completed")
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());

      if (error) throw error;

      // Generate all days in the interval
      const days = eachDayOfInterval({ start, end });

      // Group revenue by day
      const revenueByDay = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const dayAppointments = (appointments || []).filter((apt) => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= dayStart && aptDate <= dayEnd;
        });

        const revenue = dayAppointments.reduce((sum, apt) => {
          const service = apt.service as { price: number } | null;
          return sum + (service?.price || 0);
        }, 0);

        return {
          date: format(day, "dd/MM"),
          revenue,
          count: dayAppointments.length,
        };
      });

      return revenueByDay;
    },
    enabled: !!shop,
  });
}
