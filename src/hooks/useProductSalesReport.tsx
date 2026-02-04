import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type ReportPeriod = "today" | "week" | "month" | "custom";

interface ProductSalesReportFilters {
  period: ReportPeriod;
  barberId?: string;
  paymentMethod?: string;
  customRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

interface ProductSaleReport {
  id: string;
  product_name: string;
  barber_name: string | null;
  quantity: number;
  total_price: number;
  has_commission: boolean;
  commission_amount: number;
  payment_method: string | null;
  client_name: string | null;
  created_at: string;
}

interface ProductSummary {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface BarberSummary {
  barber_id: string;
  barber_name: string;
  total_quantity: number;
  total_revenue: number;
  total_commission: number;
}

interface PaymentMethodSummary {
  method: string;
  count: number;
  total: number;
}

export function useProductSalesReport(filters: ProductSalesReportFilters) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["product-sales-report", shop?.id, filters],
    queryFn: async () => {
      if (!shop?.id) return null;

      // Calcular datas do período
      let startDate: Date;
      let endDate: Date;

      switch (filters.period) {
        case "today":
          startDate = startOfDay(new Date());
          endDate = endOfDay(new Date());
          break;
        case "week":
          startDate = startOfWeek(new Date(), { locale: ptBR });
          endDate = endOfWeek(new Date(), { locale: ptBR });
          break;
        case "month":
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case "custom":
          startDate = filters.customRange?.from 
            ? startOfDay(filters.customRange.from)
            : startOfMonth(new Date());
          endDate = filters.customRange?.to 
            ? endOfDay(filters.customRange.to)
            : endOfDay(new Date());
          break;
        default:
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
      }

      // Buscar vendas
      let query = supabase
        .from("product_sales")
        .select(`
          id,
          quantity,
          total_price,
          has_commission,
          commission_amount,
          payment_method,
          client_name,
          created_at,
          barber_id,
          product_id,
          product:products(id, name),
          barber:barbers(id, name)
        `)
        .eq("shop_id", shop.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (filters.barberId) {
        query = query.eq("barber_id", filters.barberId);
      }

      if (filters.paymentMethod) {
        query = query.eq("payment_method", filters.paymentMethod);
      }

      const { data: salesData, error } = await query;
      if (error) throw error;

      // Mapear dados
      const sales: ProductSaleReport[] = salesData.map((sale: any) => ({
        id: sale.id,
        product_name: sale.product?.name || "Produto removido",
        barber_name: sale.barber?.name || null,
        quantity: sale.quantity,
        total_price: sale.total_price,
        has_commission: sale.has_commission,
        commission_amount: sale.commission_amount || 0,
        payment_method: sale.payment_method,
        client_name: sale.client_name,
        created_at: sale.created_at,
      }));

      // Calcular métricas
      const totalSales = sales.length;
      const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
      const totalRevenue = sales.reduce((sum, s) => sum + s.total_price, 0);
      const totalCommission = sales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);

      // Agrupar por produto
      const productMap = new Map<string, ProductSummary>();
      salesData.forEach((sale: any) => {
        const productId = sale.product_id;
        const productName = sale.product?.name || "Produto removido";
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product_id: productId,
            product_name: productName,
            total_quantity: 0,
            total_revenue: 0,
          });
        }
        
        const existing = productMap.get(productId)!;
        existing.total_quantity += sale.quantity;
        existing.total_revenue += sale.total_price;
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);

      // Agrupar por barbeiro
      const barberMap = new Map<string, BarberSummary>();
      salesData.forEach((sale: any) => {
        if (!sale.barber_id) return;
        
        const barberId = sale.barber_id;
        const barberName = sale.barber?.name || "Sem barbeiro";
        
        if (!barberMap.has(barberId)) {
          barberMap.set(barberId, {
            barber_id: barberId,
            barber_name: barberName,
            total_quantity: 0,
            total_revenue: 0,
            total_commission: 0,
          });
        }
        
        const existing = barberMap.get(barberId)!;
        existing.total_quantity += sale.quantity;
        existing.total_revenue += sale.total_price;
        existing.total_commission += sale.commission_amount || 0;
      });

      const salesByBarber = Array.from(barberMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue);

      // Agrupar por método de pagamento
      const paymentMap = new Map<string, PaymentMethodSummary>();
      salesData.forEach((sale: any) => {
        const method = sale.payment_method || "Não informado";
        
        if (!paymentMap.has(method)) {
          paymentMap.set(method, {
            method,
            count: 0,
            total: 0,
          });
        }
        
        const existing = paymentMap.get(method)!;
        existing.count += 1;
        existing.total += sale.total_price;
      });

      const salesByPaymentMethod = Array.from(paymentMap.values())
        .sort((a, b) => b.total - a.total);

      // Evolução diária
      const dailyMap = new Map<string, { date: string; revenue: number; count: number }>();
      salesData.forEach((sale: any) => {
        const dateKey = format(new Date(sale.created_at), "dd/MM", { locale: ptBR });
        
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, { date: dateKey, revenue: 0, count: 0 });
        }
        
        const existing = dailyMap.get(dateKey)!;
        existing.revenue += sale.total_price;
        existing.count += sale.quantity;
      });

      const chartData = Array.from(dailyMap.values())
        .sort((a, b) => {
          const [dayA, monthA] = a.date.split("/").map(Number);
          const [dayB, monthB] = b.date.split("/").map(Number);
          return monthA !== monthB ? monthA - monthB : dayA - dayB;
        });

      return {
        sales,
        metrics: {
          totalSales,
          totalQuantity,
          totalRevenue,
          totalCommission,
          averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
        },
        topProducts,
        salesByBarber,
        salesByPaymentMethod,
        chartData,
      };
    },
    enabled: !!shop?.id,
  });
}
