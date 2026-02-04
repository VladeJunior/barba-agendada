-- Tabela de vendas de produtos
CREATE TABLE public.product_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  barber_id uuid REFERENCES barbers(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  has_commission boolean NOT NULL DEFAULT false,
  commission_rate numeric DEFAULT 0,
  commission_amount numeric DEFAULT 0,
  client_name text,
  client_phone text,
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_product_sales_shop_id ON public.product_sales(shop_id);
CREATE INDEX idx_product_sales_appointment_id ON public.product_sales(appointment_id);
CREATE INDEX idx_product_sales_barber_id ON public.product_sales(barber_id);
CREATE INDEX idx_product_sales_created_at ON public.product_sales(created_at);

-- RLS
ALTER TABLE public.product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage product sales"
  ON public.product_sales FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shops WHERE shops.id = product_sales.shop_id 
    AND shops.owner_id = auth.uid()
  ));

CREATE POLICY "Barbers can view their own sales"
  ON public.product_sales FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM barbers 
    WHERE barbers.id = product_sales.barber_id 
    AND barbers.user_id = auth.uid()
  ));

-- Função para decrementar estoque automaticamente
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id 
    AND track_stock = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para decrementar estoque na venda
CREATE TRIGGER on_product_sale_decrement_stock
  AFTER INSERT ON public.product_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_product_stock();