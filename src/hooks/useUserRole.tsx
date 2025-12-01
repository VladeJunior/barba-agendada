import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = "owner" | "barber" | "client" | null;

interface UserRoleData {
  role: UserRole;
  shopId: string | null;
  barberId: string | null;
  isLoading: boolean;
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return { role: null, shopId: null, barberId: null };

      // First check if user is a shop owner
      const { data: ownerShop } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (ownerShop) {
        return { role: "owner" as UserRole, shopId: ownerShop.id, barberId: null };
      }

      // Check if user is a barber
      const { data: barber } = await supabase
        .from("barbers")
        .select("id, shop_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (barber) {
        return { role: "barber" as UserRole, shopId: barber.shop_id, barberId: barber.id };
      }

      // Check user_roles table as fallback
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role, shop_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userRole) {
        return { 
          role: userRole.role as UserRole, 
          shopId: userRole.shop_id, 
          barberId: null 
        };
      }

      return { role: null, shopId: null, barberId: null };
    },
    enabled: !!user,
  });

  return {
    role: data?.role ?? null,
    shopId: data?.shopId ?? null,
    barberId: data?.barberId ?? null,
    isLoading,
  };
}
