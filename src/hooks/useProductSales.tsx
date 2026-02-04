import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "./useShop";
import { toast } from "sonner";

export interface ProductSale {
  id: string;
  shop_id: string;
  appointment_id: string | null;
  product_id: string;
  barber_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  has_commission: boolean;
  commission_rate: number;
  commission_amount: number;
  client_name: string | null;
  client_phone: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
  };
  barber?: {
    id: string;
    name: string;
  };
}

export interface CreateProductSaleInput {
  appointment_id?: string | null;
  product_id: string;
  barber_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  has_commission: boolean;
  commission_rate?: number;
  commission_amount?: number;
  client_name?: string | null;
  client_phone?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}

export function useProductSales(appointmentId?: string) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["product-sales", shop?.id, appointmentId],
    queryFn: async () => {
      if (!shop?.id) return [];

      let query = supabase
        .from("product_sales")
        .select(`
          *,
          product:products(id, name, image_url),
          barber:barbers(id, name)
        `)
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false });

      if (appointmentId) {
        query = query.eq("appointment_id", appointmentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductSale[];
    },
    enabled: !!shop?.id,
  });
}

export function useAppointmentProductSales(appointmentId: string | null) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["product-sales", "appointment", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return [];

      const { data, error } = await supabase
        .from("product_sales")
        .select(`
          *,
          product:products(id, name, image_url),
          barber:barbers(id, name)
        `)
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProductSale[];
    },
    enabled: !!appointmentId,
  });
}

export function useCreateProductSale() {
  const queryClient = useQueryClient();
  const { data: shop } = useShop();

  return useMutation({
    mutationFn: async (sales: CreateProductSaleInput | CreateProductSaleInput[]) => {
      if (!shop?.id) throw new Error("Loja não encontrada");

      const salesArray = Array.isArray(sales) ? sales : [sales];
      const salesWithShop = salesArray.map(sale => ({
        ...sale,
        shop_id: shop.id,
      }));

      const { data, error } = await supabase
        .from("product_sales")
        .insert(salesWithShop)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      const salesArray = Array.isArray(variables) ? variables : [variables];
      if (salesArray[0]?.appointment_id) {
        queryClient.invalidateQueries({ 
          queryKey: ["product-sales", "appointment", salesArray[0].appointment_id] 
        });
      }
      
      toast.success("Venda registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao registrar venda: " + error.message);
    },
  });
}

export function useDeleteProductSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (saleId: string) => {
      const { error } = await supabase
        .from("product_sales")
        .delete()
        .eq("id", saleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto removido da venda!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover produto: " + error.message);
    },
  });
}

export function useProductSalesFilters(filters: {
  startDate?: Date;
  endDate?: Date;
  barberId?: string;
}) {
  const { data: shop } = useShop();

  return useQuery({
    queryKey: ["product-sales-filtered", shop?.id, filters],
    queryFn: async () => {
      if (!shop?.id) return [];

      let query = supabase
        .from("product_sales")
        .select(`
          *,
          product:products(id, name, image_url),
          barber:barbers(id, name)
        `)
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false });

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }
      if (filters.barberId) {
        query = query.eq("barber_id", filters.barberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductSale[];
    },
    enabled: !!shop?.id,
  });
}
