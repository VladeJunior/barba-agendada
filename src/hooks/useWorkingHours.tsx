import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { toast } from "sonner";

export interface WorkingHour {
  id: string;
  barber_id: string;
  shop_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface WorkingHourInput {
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export function useWorkingHours(barberId?: string) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["working_hours", barberId],
    queryFn: async () => {
      if (!shop || !barberId) return [];

      const { data, error } = await supabase
        .from("working_hours")
        .select("*")
        .eq("shop_id", shop.id)
        .eq("barber_id", barberId)
        .order("day_of_week");

      if (error) throw error;
      return data as WorkingHour[];
    },
    enabled: !!shop && !!barberId,
  });
}

export function useSaveWorkingHours() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async ({ barberId, hours }: { barberId: string; hours: WorkingHourInput[] }) => {
      if (!shop) throw new Error("Shop not found");

      // Delete existing hours for this barber
      const { error: deleteError } = await supabase
        .from("working_hours")
        .delete()
        .eq("shop_id", shop.id)
        .eq("barber_id", barberId);

      if (deleteError) throw deleteError;

      // Insert new hours
      const hoursWithShop = hours
        .filter(h => h.is_active)
        .map(h => ({
          ...h,
          shop_id: shop.id,
        }));

      if (hoursWithShop.length > 0) {
        const { error: insertError } = await supabase
          .from("working_hours")
          .insert(hoursWithShop);

        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, { barberId }) => {
      queryClient.invalidateQueries({ queryKey: ["working_hours", barberId] });
      toast.success("Horários salvos com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar horários: " + error.message);
    },
  });
}
