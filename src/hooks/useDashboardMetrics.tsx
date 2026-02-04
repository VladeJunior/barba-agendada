import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";

export type PeriodType = "today" | "week" | "month";

interface AppointmentWithRelations {
  id: string;
  barber_id: string;
  service_id: string;
  status: string;
  payment_status: string;
  start_time: string;
  barber: { name: string } | null;
  service: { name: string; price: number } | null;
}

interface ProductSaleWithProduct {
  total_price: number;
  quantity: number;
  product_id: string;
  product: { name: string } | null;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  min_stock_alert: number | null;
}

export function useDashboardMetrics(period: PeriodType) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["dashboard-metrics", shop?.id, period],
    queryFn: async () => {
      if (!shop) return null;

      const now = new Date();
      let start: Date;
      let end: Date;
      let previousStart: Date;
      let previousEnd: Date;

      switch (period) {
        case "today":
          start = startOfDay(now);
          end = endOfDay(now);
          previousStart = startOfDay(subDays(now, 1));
          previousEnd = endOfDay(subDays(now, 1));
          break;
        case "week":
          start = startOfWeek(now, { weekStartsOn: 0 });
          end = endOfWeek(now, { weekStartsOn: 0 });
          previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
          previousEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
          break;
        case "month":
          start = startOfMonth(now);
          end = endOfMonth(now);
          previousStart = startOfMonth(subMonths(now, 1));
          previousEnd = endOfMonth(subMonths(now, 1));
          break;
      }

      // Fetch current period appointments
      const { data: currentAppointments, error: currentError } = await supabase
        .from("appointments")
        .select("id, barber_id, service_id, status, payment_status, start_time, barber:barbers(name), service:services(name, price)")
        .eq("shop_id", shop.id)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());

      if (currentError) throw currentError;

      // Fetch previous period for comparison
      const { data: previousAppointments, error: previousError } = await supabase
        .from("appointments")
        .select("id, service_id, status, service:services(price)")
        .eq("shop_id", shop.id)
        .gte("start_time", previousStart.toISOString())
        .lte("start_time", previousEnd.toISOString());

      if (previousError) throw previousError;

      // Fetch current period product sales
      const { data: currentProductSales, error: productSalesError } = await supabase
        .from("product_sales")
        .select("total_price, quantity, product_id, product:products(name)")
        .eq("shop_id", shop.id)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (productSalesError) throw productSalesError;

      // Fetch previous period product sales
      const { data: previousProductSales, error: prevProductSalesError } = await supabase
        .from("product_sales")
        .select("total_price")
        .eq("shop_id", shop.id)
        .gte("created_at", previousStart.toISOString())
        .lte("created_at", previousEnd.toISOString());

      if (prevProductSalesError) throw prevProductSalesError;

      // Fetch low stock products
      const { data: lowStockData, error: lowStockError } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock_alert")
        .eq("shop_id", shop.id)
        .eq("track_stock", true)
        .eq("is_active", true)
        .not("min_stock_alert", "is", null);

      if (lowStockError) throw lowStockError;

      // Filter low stock products in JS (since we can't do column comparison in Supabase)
      const lowStockProducts = (lowStockData || []).filter(
        (p: LowStockProduct) => p.min_stock_alert !== null && p.stock_quantity <= p.min_stock_alert
      ).sort((a: LowStockProduct, b: LowStockProduct) => a.stock_quantity - b.stock_quantity);

      const appointments = (currentAppointments || []) as AppointmentWithRelations[];
      const prevAppointments = previousAppointments || [];
      const productSales = (currentProductSales || []) as ProductSaleWithProduct[];
      const prevProductSales = previousProductSales || [];

      // Calculate appointment metrics
      const totalAppointments = appointments.filter(a => a.status !== "cancelled").length;
      const completedAppointments = appointments.filter(a => a.status === "completed");
      const cancelledAppointments = appointments.filter(a => a.status === "cancelled").length;
      const noShowAppointments = appointments.filter(a => a.status === "no_show").length;

      const serviceRevenue = completedAppointments.reduce((sum, a) => sum + (a.service?.price || 0), 0);
      const prevServiceRevenue = prevAppointments
        .filter(a => a.status === "completed")
        .reduce((sum, a) => {
          const service = a.service as { price: number } | null;
          return sum + (service?.price || 0);
        }, 0);

      const prevTotal = prevAppointments.filter(a => a.status !== "cancelled").length;

      // Calculate product sales metrics
      const productSalesRevenue = productSales.reduce((sum, ps) => sum + (ps.total_price || 0), 0);
      const productSalesCount = productSales.length;
      const prevProductSalesRevenue = prevProductSales.reduce((sum, ps) => sum + (ps.total_price || 0), 0);

      // Calculate total revenue
      const totalRevenue = serviceRevenue + productSalesRevenue;
      const prevTotalRevenue = prevServiceRevenue + prevProductSalesRevenue;

      // Revenue growth percentage (based on total)
      const revenueGrowth = prevTotalRevenue > 0 
        ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
        : totalRevenue > 0 ? 100 : 0;

      const appointmentGrowth = prevTotal > 0 
        ? ((totalAppointments - prevTotal) / prevTotal) * 100 
        : totalAppointments > 0 ? 100 : 0;

      // Product sales growth
      const productSalesGrowth = prevProductSalesRevenue > 0
        ? ((productSalesRevenue - prevProductSalesRevenue) / prevProductSalesRevenue) * 100
        : productSalesRevenue > 0 ? 100 : 0;

      // Top barbers
      const barberStats: Record<string, { name: string; count: number; revenue: number }> = {};
      completedAppointments.forEach(a => {
        const barberId = a.barber_id;
        const barberName = a.barber?.name || "Desconhecido";
        if (!barberStats[barberId]) {
          barberStats[barberId] = { name: barberName, count: 0, revenue: 0 };
        }
        barberStats[barberId].count++;
        barberStats[barberId].revenue += a.service?.price || 0;
      });

      const topBarbers = Object.values(barberStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Top services
      const serviceStats: Record<string, { name: string; count: number; revenue: number }> = {};
      completedAppointments.forEach(a => {
        const serviceId = a.service_id;
        const serviceName = a.service?.name || "Desconhecido";
        if (!serviceStats[serviceId]) {
          serviceStats[serviceId] = { name: serviceName, count: 0, revenue: 0 };
        }
        serviceStats[serviceId].count++;
        serviceStats[serviceId].revenue += a.service?.price || 0;
      });

      const topServices = Object.values(serviceStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top products
      const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
      productSales.forEach(ps => {
        const productId = ps.product_id;
        const productName = ps.product?.name || "Desconhecido";
        if (!productStats[productId]) {
          productStats[productId] = { name: productName, quantity: 0, revenue: 0 };
        }
        productStats[productId].quantity += ps.quantity;
        productStats[productId].revenue += ps.total_price;
      });

      const topProducts = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // Status breakdown
      const statusBreakdown = [
        { name: "Concluídos", value: completedAppointments.length, color: "#22c55e" },
        { name: "Agendados", value: appointments.filter(a => a.status === "scheduled" || a.status === "confirmed").length, color: "#3b82f6" },
        { name: "Cancelados", value: cancelledAppointments, color: "#ef4444" },
        { name: "Não compareceu", value: noShowAppointments, color: "#f97316" },
      ].filter(s => s.value > 0);

      return {
        totalAppointments,
        completedAppointments: completedAppointments.length,
        cancelledAppointments,
        noShowAppointments,
        serviceRevenue,
        productSalesRevenue,
        productSalesCount,
        productSalesGrowth,
        totalRevenue,
        revenueGrowth,
        appointmentGrowth,
        topBarbers,
        topServices,
        topProducts,
        lowStockProducts,
        statusBreakdown,
        averageTicket: completedAppointments.length > 0 ? serviceRevenue / completedAppointments.length : 0,
      };
    },
    enabled: !!shop,
  });
}
