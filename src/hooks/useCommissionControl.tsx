import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { toast } from "sonner";
import { startOfMonth, endOfMonth } from "date-fns";

export interface CommissionPayment {
  id: string;
  shop_id: string;
  barber_id: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  commission_rate: number;
  commission_amount: number;
  status: "pending" | "partial" | "paid";
  amount_paid: number;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BarberCommissionSummary {
  barber_id: string;
  barber_name: string;
  barber_avatar: string | null;
  commission_rate: number;
  total_revenue: number;
  commission_amount: number;
  amount_paid: number;
  pending_amount: number;
  status: "pending" | "partial" | "paid";
}

export interface CommissionFilters {
  startDate: Date;
  endDate: Date;
  barberId?: string;
  status?: string;
}

export function useCommissionSummary(filters: CommissionFilters) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["commission-summary", shop?.id, filters],
    queryFn: async () => {
      if (!shop) return null;

      // Get completed appointments in the period
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select(`
          id,
          barber_id,
          final_price,
          original_price,
          barbers!inner(
            id,
            name,
            avatar_url,
            commission_rate
          )
        `)
        .eq("shop_id", shop.id)
        .eq("status", "completed")
        .gte("start_time", filters.startDate.toISOString())
        .lte("start_time", filters.endDate.toISOString());

      if (error) throw error;

      // Get product sales with commission in the period
      const { data: productSales, error: productSalesError } = await supabase
        .from("product_sales")
        .select(`
          id,
          barber_id,
          total_price,
          has_commission,
          commission_rate,
          commission_amount,
          barbers(
            id,
            name,
            avatar_url,
            commission_rate
          )
        `)
        .eq("shop_id", shop.id)
        .eq("has_commission", true)
        .gte("created_at", filters.startDate.toISOString())
        .lte("created_at", filters.endDate.toISOString());

      if (productSalesError) throw productSalesError;

      // Get existing payments for the period
      const { data: payments, error: paymentsError } = await supabase
        .from("commission_payments")
        .select("*")
        .eq("shop_id", shop.id)
        .gte("period_start", filters.startDate.toISOString())
        .lte("period_end", filters.endDate.toISOString());

      if (paymentsError) throw paymentsError;

      // Group by barber
      const barberMap = new Map<string, BarberCommissionSummary & { 
        service_revenue: number;
        service_commission: number;
        product_revenue: number;
        product_commission: number;
      }>();

      // Process service appointments
      appointments?.forEach((apt) => {
        const barber = apt.barbers as any;
        const barberId = apt.barber_id;
        const price = Number(apt.final_price || apt.original_price || 0);
        const rate = Number(barber?.commission_rate || 0);

        if (!barberMap.has(barberId)) {
          barberMap.set(barberId, {
            barber_id: barberId,
            barber_name: barber?.name || "Barbeiro",
            barber_avatar: barber?.avatar_url,
            commission_rate: rate,
            total_revenue: 0,
            commission_amount: 0,
            amount_paid: 0,
            pending_amount: 0,
            status: "pending",
            service_revenue: 0,
            service_commission: 0,
            product_revenue: 0,
            product_commission: 0,
          });
        }

        const summary = barberMap.get(barberId)!;
        summary.service_revenue += price;
        summary.service_commission += price * (rate / 100);
        summary.total_revenue += price;
        summary.commission_amount += price * (rate / 100);
      });

      // Process product sales
      productSales?.forEach((sale) => {
        const barber = sale.barbers as any;
        const barberId = sale.barber_id;
        if (!barberId) return;

        const totalPrice = Number(sale.total_price || 0);
        const commissionAmount = Number(sale.commission_amount || 0);
        const rate = Number(barber?.commission_rate || 0);

        if (!barberMap.has(barberId)) {
          barberMap.set(barberId, {
            barber_id: barberId,
            barber_name: barber?.name || "Barbeiro",
            barber_avatar: barber?.avatar_url,
            commission_rate: rate,
            total_revenue: 0,
            commission_amount: 0,
            amount_paid: 0,
            pending_amount: 0,
            status: "pending",
            service_revenue: 0,
            service_commission: 0,
            product_revenue: 0,
            product_commission: 0,
          });
        }

        const summary = barberMap.get(barberId)!;
        summary.product_revenue += totalPrice;
        summary.product_commission += commissionAmount;
        summary.total_revenue += totalPrice;
        summary.commission_amount += commissionAmount;
      });

      // Apply payments
      payments?.forEach((payment) => {
        const summary = barberMap.get(payment.barber_id);
        if (summary) {
          summary.amount_paid += Number(payment.amount_paid || 0);
        }
      });

      // Calculate pending and status
      const summaries: BarberCommissionSummary[] = [];
      barberMap.forEach((summary) => {
        summary.pending_amount = summary.commission_amount - summary.amount_paid;
        if (summary.amount_paid >= summary.commission_amount) {
          summary.status = "paid";
        } else if (summary.amount_paid > 0) {
          summary.status = "partial";
        } else {
          summary.status = "pending";
        }

        // Apply filters
        if (filters.barberId && summary.barber_id !== filters.barberId) return;
        if (filters.status && summary.status !== filters.status) return;

        summaries.push(summary);
      });

      // Calculate totals
      const totals = summaries.reduce(
        (acc, s) => ({
          totalRevenue: acc.totalRevenue + s.total_revenue,
          totalCommission: acc.totalCommission + s.commission_amount,
          totalPaid: acc.totalPaid + s.amount_paid,
          totalPending: acc.totalPending + s.pending_amount,
        }),
        { totalRevenue: 0, totalCommission: 0, totalPaid: 0, totalPending: 0 }
      );

      return { summaries, totals };
    },
    enabled: !!shop,
  });
}

export function useCommissionPayments(filters: CommissionFilters) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["commission-payments", shop?.id, filters],
    queryFn: async () => {
      if (!shop) return [];

      let query = supabase
        .from("commission_payments")
        .select(`
          *,
          barbers!inner(
            id,
            name,
            avatar_url
          )
        `)
        .eq("shop_id", shop.id)
        .order("paid_at", { ascending: false });

      if (filters.barberId) {
        query = query.eq("barber_id", filters.barberId);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    },
    enabled: !!shop,
  });
}

export function useCreateCommissionPayment() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async (payment: {
      barber_id: string;
      period_start: Date;
      period_end: Date;
      total_revenue: number;
      commission_rate: number;
      commission_amount: number;
      amount_paid: number;
      payment_method: string;
      notes?: string;
    }) => {
      if (!shop) throw new Error("Shop not found");

      const status =
        payment.amount_paid >= payment.commission_amount
          ? "paid"
          : payment.amount_paid > 0
          ? "partial"
          : "pending";

      const { data, error } = await supabase
        .from("commission_payments")
        .insert({
          shop_id: shop.id,
          barber_id: payment.barber_id,
          period_start: payment.period_start.toISOString(),
          period_end: payment.period_end.toISOString(),
          total_revenue: payment.total_revenue,
          commission_rate: payment.commission_rate,
          commission_amount: payment.commission_amount,
          amount_paid: payment.amount_paid,
          status,
          paid_at: payment.amount_paid > 0 ? new Date().toISOString() : null,
          payment_method: payment.payment_method,
          notes: payment.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-summary"] });
      queryClient.invalidateQueries({ queryKey: ["commission-payments"] });
      toast.success("Pagamento registrado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao registrar pagamento: " + error.message);
    },
  });
}

export function useUpdateCommissionPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      amount_paid,
      payment_method,
      notes,
      commission_amount,
    }: {
      id: string;
      amount_paid: number;
      payment_method: string;
      notes?: string;
      commission_amount: number;
    }) => {
      const status =
        amount_paid >= commission_amount
          ? "paid"
          : amount_paid > 0
          ? "partial"
          : "pending";

      const { data, error } = await supabase
        .from("commission_payments")
        .update({
          amount_paid,
          status,
          paid_at: amount_paid > 0 ? new Date().toISOString() : null,
          payment_method,
          notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-summary"] });
      queryClient.invalidateQueries({ queryKey: ["commission-payments"] });
      toast.success("Pagamento atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar pagamento: " + error.message);
    },
  });
}
