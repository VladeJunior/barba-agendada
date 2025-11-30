import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { toast } from "sonner";

export interface BlockedTime {
  id: string;
  shop_id: string;
  barber_id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string;
}

export interface BlockedTimeInput {
  barber_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export function useBlockedTimes(barberId?: string) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["blocked-times", shop?.id, barberId],
    queryFn: async () => {
      if (!shop) return [];

      let query = supabase
        .from("blocked_times")
        .select("*")
        .eq("shop_id", shop.id)
        .order("start_time", { ascending: false });

      if (barberId) {
        query = query.eq("barber_id", barberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlockedTime[];
    },
    enabled: !!shop,
  });
}

export function useCreateBlockedTime() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async (input: BlockedTimeInput) => {
      if (!shop) throw new Error("Shop not found");

      const { data, error } = await supabase
        .from("blocked_times")
        .insert({
          shop_id: shop.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-times"] });
      toast.success("Bloqueio criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar bloqueio: " + error.message);
    },
  });
}

export function useDeleteBlockedTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("blocked_times")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-times"] });
      toast.success("Bloqueio removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover bloqueio: " + error.message);
    },
  });
}
