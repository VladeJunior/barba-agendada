import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { useToast } from "./use-toast";

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  cost_price: number | null;
  sku: string | null;
  image_url: string | null;
  track_stock: boolean;
  stock_quantity: number;
  min_stock_alert: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at">;
export type ProductUpdate = Partial<ProductInsert> & { id: string };

export function useProducts() {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["products", shop?.id],
    queryFn: async () => {
      if (!shop?.id) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", shop.id)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!shop?.id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Omit<ProductInsert, "shop_id">) => {
      if (!shop?.id) throw new Error("Loja não encontrada");

      const { data, error } = await supabase
        .from("products")
        .insert({ ...product, shop_id: shop.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shop?.id] });
      toast({
        title: "Produto criado",
        description: "O produto foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shop?.id] });
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shop?.id] });
      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
