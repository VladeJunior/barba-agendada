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
  getHours,
  getDay,
  parseISO
} from "date-fns";
import { PeriodType } from "./useDashboardMetrics";

const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8h às 21h

export function useOperationalMetrics(period: PeriodType) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["operational-metrics", shop?.id, period],
    queryFn: async () => {
      if (!shop) return null;

      const now = new Date();
      let start: Date;
      let end: Date;

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

      // Fetch all appointments in period
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("id, start_time, status, client_phone, client_name, service:services(price)")
        .eq("shop_id", shop.id)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());

      if (error) throw error;

      const allAppointments = appointments || [];

      // 1. Peak Hours Analysis - Heatmap data
      const heatmapData = HOURS.map((hour) => {
        const hourData: any = { hour: `${hour}h` };
        
        DAYS_OF_WEEK.forEach((day, dayIndex) => {
          const count = allAppointments.filter((apt) => {
            const aptDate = parseISO(apt.start_time);
            return getHours(aptDate) === hour && getDay(aptDate) === dayIndex;
          }).length;
          
          hourData[day] = count;
        });

        return hourData;
      });

      // Find peak hour and day
      let peakCount = 0;
      let peakHour = "";
      let peakDay = "";

      heatmapData.forEach((hourData) => {
        DAYS_OF_WEEK.forEach((day) => {
          if (hourData[day] > peakCount) {
            peakCount = hourData[day];
            peakHour = hourData.hour;
            peakDay = day;
          }
        });
      });

      // 2. Cancellation Analysis
      const totalScheduled = allAppointments.filter(
        (a) => a.status === "scheduled" || a.status === "confirmed" || a.status === "completed"
      ).length;
      const cancelled = allAppointments.filter((a) => a.status === "cancelled").length;
      const noShow = allAppointments.filter((a) => a.status === "no_show").length;
      const completed = allAppointments.filter((a) => a.status === "completed").length;

      const cancellationRate = totalScheduled > 0 ? (cancelled / totalScheduled) * 100 : 0;
      const noShowRate = totalScheduled > 0 ? (noShow / totalScheduled) * 100 : 0;
      const completionRate = totalScheduled > 0 ? (completed / totalScheduled) * 100 : 0;

      const statusDistribution = [
        { name: "Concluídos", value: completed, percentage: completionRate },
        { name: "Cancelados", value: cancelled, percentage: cancellationRate },
        { name: "Não Compareceu", value: noShow, percentage: noShowRate },
      ];

      // 3. Client Analysis
      const clientMap = new Map<string, {
        phone: string;
        name: string;
        count: number;
        totalSpent: number;
        lastVisit: string;
      }>();

      allAppointments
        .filter((apt) => apt.status === "completed" && apt.client_phone)
        .forEach((apt) => {
          const phone = apt.client_phone!;
          const existing = clientMap.get(phone);
          const service = apt.service as { price: number } | null;
          const spent = service?.price || 0;

          if (existing) {
            existing.count++;
            existing.totalSpent += spent;
            if (apt.start_time > existing.lastVisit) {
              existing.lastVisit = apt.start_time;
            }
          } else {
            clientMap.set(phone, {
              phone,
              name: apt.client_name || "Cliente",
              count: 1,
              totalSpent: spent,
              lastVisit: apt.start_time,
            });
          }
        });

      const clients = Array.from(clientMap.values());
      
      // Top clients by frequency
      const topClients = clients
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top clients by spending
      const topSpenders = clients
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      // New vs Returning (based on this period only)
      const newClients = clients.filter((c) => c.count === 1).length;
      const returningClients = clients.filter((c) => c.count > 1).length;

      return {
        heatmapData,
        peakHour,
        peakDay,
        peakCount,
        cancellationRate,
        noShowRate,
        completionRate,
        statusDistribution,
        totalScheduled,
        cancelled,
        noShow,
        completed,
        topClients,
        topSpenders,
        newClients,
        returningClients,
        totalUniqueClients: clients.length,
      };
    },
    enabled: !!shop,
  });
}
