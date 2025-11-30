import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { toast } from "sonner";

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceInput {
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
}

export function useServices() {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["services", shop?.id],
    queryFn: async () => {
      if (!shop) return [];

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("shop_id", shop.id)
        .order("name");

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!shop,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async (input: ServiceInput) => {
      if (!shop) throw new Error("Shop not found");

      const { data, error } = await supabase
        .from("services")
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
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar serviço: " + error.message);
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: ServiceInput & { id: string }) => {
      const { data, error } = await supabase
        .from("services")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar serviço: " + error.message);
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir serviço: " + error.message);
    },
  });
}
