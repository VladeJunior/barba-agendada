import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { toast } from "sonner";

export interface StockMovement {
  id: string;
  shop_id: string;
  product_id: string;
  movement_type: "entry" | "exit" | "adjustment";
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_by: string | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

export interface CreateStockMovementInput {
  product_id: string;
  movement_type: "entry" | "adjustment";
  quantity: number;
  reason?: string;
}

export function useStockMovements(productId?: string) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["stock-movements", shop?.id, productId],
    queryFn: async () => {
      if (!shop?.id) return [];

      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          product:products(id, name, image_url)
        `)
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!shop?.id,
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async (input: CreateStockMovementInput) => {
      if (!shop?.id) throw new Error("Loja não encontrada");

      // Buscar estoque atual do produto
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", input.product_id)
        .single();

      if (productError) throw productError;

      const previousQuantity = product.stock_quantity;
      let newQuantity: number;

      if (input.movement_type === "entry") {
        newQuantity = previousQuantity + input.quantity;
      } else {
        // adjustment - pode ser positivo ou negativo
        newQuantity = Math.max(0, previousQuantity + input.quantity);
      }

      // Atualizar estoque do produto
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq("id", input.product_id);

      if (updateError) throw updateError;

      // Registrar movimentação
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("stock_movements")
        .insert({
          shop_id: shop.id,
          product_id: input.product_id,
          movement_type: input.movement_type,
          quantity: input.quantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason: input.reason || null,
          reference_type: "manual",
          created_by: user.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Movimentação registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao registrar movimentação: " + error.message);
    },
  });
}

export function useProductStockMovements(productId: string | null) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["stock-movements", "product", productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!productId,
  });
}
