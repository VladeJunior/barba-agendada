import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { toast } from "sonner";

export interface LoyaltyPoints {
  id: string;
  shop_id: string;
  client_phone: string;
  client_name: string | null;
  total_points: number;
  lifetime_points: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyReward {
  id: string;
  shop_id: string;
  title: string;
  description: string | null;
  points_required: number;
  discount_percentage: number | null;
  discount_amount: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyCoupon {
  id: string;
  shop_id: string;
  code: string;
  description: string | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  shop_id: string;
  client_phone: string;
  appointment_id: string | null;
  reward_id: string | null;
  points_change: number;
  description: string;
  created_at: string;
}

// Get client points
export function useClientPoints(shopId: string | undefined, clientPhone: string | undefined) {
  return useQuery({
    queryKey: ["loyalty-points", shopId, clientPhone],
    queryFn: async () => {
      if (!shopId || !clientPhone) return null;

      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("shop_id", shopId)
        .eq("client_phone", clientPhone)
        .maybeSingle();

      if (error) throw error;
      return data as LoyaltyPoints | null;
    },
    enabled: !!shopId && !!clientPhone,
  });
}

// Get shop rewards
export function useShopRewards(shopId: string | undefined) {
  return useQuery({
    queryKey: ["loyalty-rewards", shopId],
    queryFn: async () => {
      if (!shopId) return [];

      const { data, error } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("shop_id", shopId)
        .order("points_required");

      if (error) throw error;
      return data as LoyaltyReward[];
    },
    enabled: !!shopId,
  });
}

// Get shop coupons
export function useShopCoupons(shopId: string | undefined) {
  return useQuery({
    queryKey: ["loyalty-coupons", shopId],
    queryFn: async () => {
      if (!shopId) return [];

      const { data, error } = await supabase
        .from("loyalty_coupons")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LoyaltyCoupon[];
    },
    enabled: !!shopId,
  });
}

// Validate coupon
export function useValidateCoupon(shopId: string | undefined) {
  return useMutation({
    mutationFn: async (code: string) => {
      if (!shopId) throw new Error("Shop not found");

      const { data, error } = await supabase
        .from("loyalty_coupons")
        .select("*")
        .eq("shop_id", shopId)
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Cupom inválido");

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error("Cupom expirado");
      }

      // Check max uses
      if (data.max_uses && data.current_uses >= data.max_uses) {
        throw new Error("Cupom esgotado");
      }

      return data as LoyaltyCoupon;
    },
  });
}

// Create/Update reward
export function useUpsertReward() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async (reward: Partial<LoyaltyReward> & { id?: string }) => {
      if (!shop) throw new Error("Shop not found");

      const { id, shop_id, created_at, updated_at, ...rewardData } = reward as any;

      if (id) {
        const { data, error } = await supabase
          .from("loyalty_rewards")
          .update(rewardData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("loyalty_rewards")
          .insert({ ...rewardData, shop_id: shop.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
      toast.success("Recompensa salva!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar recompensa: " + error.message);
    },
  });
}

// Delete reward
export function useDeleteReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("loyalty_rewards")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
      toast.success("Recompensa removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover recompensa: " + error.message);
    },
  });
}

// Create/Update coupon
export function useUpsertCoupon() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async (coupon: Partial<LoyaltyCoupon> & { id?: string }) => {
      if (!shop) throw new Error("Shop not found");

      const { id, shop_id, created_at, updated_at, current_uses, ...couponData } = coupon as any;
      // Force code to uppercase
      if (couponData.code) {
        couponData.code = couponData.code.toUpperCase();
      }

      if (id) {
        const { data, error } = await supabase
          .from("loyalty_coupons")
          .update(couponData)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("loyalty_coupons")
          .insert({ ...couponData, shop_id: shop.id })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-coupons"] });
      toast.success("Cupom salvo!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar cupom: " + error.message);
    },
  });
}

// Delete coupon
export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("loyalty_coupons")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-coupons"] });
      toast.success("Cupom removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover cupom: " + error.message);
    },
  });
}

// Redeem reward
export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      clientPhone,
      rewardId,
      pointsRequired,
    }: {
      shopId: string;
      clientPhone: string;
      rewardId: string;
      pointsRequired: number;
    }) => {
      // Get current points
      const { data: pointsData, error: pointsError } = await supabase
        .from("loyalty_points")
        .select("total_points")
        .eq("shop_id", shopId)
        .eq("client_phone", clientPhone)
        .single();

      if (pointsError) throw pointsError;
      if (pointsData.total_points < pointsRequired) {
        throw new Error("Pontos insuficientes");
      }

      // Deduct points
      const { error: updateError } = await supabase
        .from("loyalty_points")
        .update({
          total_points: pointsData.total_points - pointsRequired,
        })
        .eq("shop_id", shopId)
        .eq("client_phone", clientPhone);

      if (updateError) throw updateError;

      // Create transaction
      const { error: transactionError } = await supabase
        .from("loyalty_transactions")
        .insert({
          shop_id: shopId,
          client_phone: clientPhone,
          reward_id: rewardId,
          points_change: -pointsRequired,
          description: "Resgate de recompensa",
        });

      if (transactionError) throw transactionError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["loyalty-points", variables.shopId, variables.clientPhone],
      });
      toast.success("Recompensa resgatada!");
    },
    onError: (error) => {
      toast.error("Erro ao resgatar recompensa: " + error.message);
    },
  });
}
