import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { startOfMonth, endOfMonth, format } from "date-fns";

export function useLoyaltyAnalytics(startDate: Date, endDate: Date) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["loyalty-analytics", shop?.id, startDate, endDate],
    queryFn: async () => {
      if (!shop?.id) return null;

      // Fetch redemptions by day
      const { data: redemptions } = await supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("shop_id", shop.id)
        .not("reward_id", "is", null)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });

      // Group redemptions by date
      const redemptionsByDate = redemptions?.reduce((acc, transaction) => {
        const date = format(new Date(transaction.created_at), "dd/MM");
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Fetch most used coupons
      const { data: coupons } = await supabase
        .from("loyalty_coupons")
        .select("*")
        .eq("shop_id", shop.id)
        .gt("current_uses", 0)
        .order("current_uses", { ascending: false })
        .limit(5);

      // Fetch top clients by points
      const { data: topClients } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("shop_id", shop.id)
        .order("total_points", { ascending: false })
        .limit(10);

      // Calculate conversion rate (redemptions vs completed appointments)
      const { count: totalRedemptions } = await supabase
        .from("loyalty_transactions")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id)
        .not("reward_id", "is", null)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const { count: completedAppointments } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id)
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const conversionRate = completedAppointments && completedAppointments > 0
        ? ((totalRedemptions || 0) / completedAppointments) * 100
        : 0;

      // Total points awarded
      const { data: pointsAwarded } = await supabase
        .from("loyalty_transactions")
        .select("points_change")
        .eq("shop_id", shop.id)
        .gt("points_change", 0)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const totalPointsAwarded = pointsAwarded?.reduce((sum, t) => sum + t.points_change, 0) || 0;

      // Total points redeemed
      const { data: pointsRedeemed } = await supabase
        .from("loyalty_transactions")
        .select("points_change")
        .eq("shop_id", shop.id)
        .lt("points_change", 0)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const totalPointsRedeemed = Math.abs(pointsRedeemed?.reduce((sum, t) => sum + t.points_change, 0) || 0);

      return {
        redemptionsByDate,
        topCoupons: coupons || [],
        topClients: topClients || [],
        conversionRate: conversionRate.toFixed(2),
        totalRedemptions: totalRedemptions || 0,
        completedAppointments: completedAppointments || 0,
        totalPointsAwarded,
        totalPointsRedeemed,
      };
    },
    enabled: !!shop?.id,
  });
}
