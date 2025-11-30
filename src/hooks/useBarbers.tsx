import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { toast } from "sonner";

export interface Barber {
  id: string;
  shop_id: string;
  user_id: string | null;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  commission_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarberInput {
  name: string;
  bio?: string;
  phone?: string;
  avatar_url?: string;
  commission_rate?: number;
  is_active?: boolean;
}

export function useBarbers() {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["barbers", shop?.id],
    queryFn: async () => {
      if (!shop) return [];

      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .eq("shop_id", shop.id)
        .order("name");

      if (error) throw error;
      return data as Barber[];
    },
    enabled: !!shop,
  });
}

export function useCreateBarber() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async (input: BarberInput) => {
      if (!shop) throw new Error("Shop not found");

      const { data, error } = await supabase
        .from("barbers")
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
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
      toast.success("Barbeiro adicionado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar barbeiro: " + error.message);
    },
  });
}

export function useUpdateBarber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: BarberInput & { id: string }) => {
      const { data, error } = await supabase
        .from("barbers")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
      toast.success("Barbeiro atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar barbeiro: " + error.message);
    },
  });
}

export function useDeleteBarber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barbers"] });
      toast.success("Barbeiro removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover barbeiro: " + error.message);
    },
  });
}
