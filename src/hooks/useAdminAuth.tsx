import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "super_admin",
      });

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      return data === true;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (!authLoading && !roleLoading && user && isAdmin === false) {
      navigate("/");
    }
  }, [user, authLoading, roleLoading, isAdmin, navigate]);

  return {
    isAdmin: isAdmin === true,
    loading: authLoading || roleLoading,
  };
}
