import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useShop() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["shop", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // First check if user is an owner
      const { data: ownerShop, error: ownerError } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (ownerShop) return ownerShop;

      // If not owner, check if user is a barber
      const { data: barber } = await supabase
        .from("barbers")
        .select("shop_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (barber) {
        const { data: barberShop, error: shopError } = await supabase
          .from("shops")
          .select("*")
          .eq("id", barber.shop_id)
          .single();

        if (shopError) throw shopError;
        return barberShop;
      }

      return null;
    },
    enabled: !!user,
  });
}
