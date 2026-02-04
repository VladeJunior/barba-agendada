-- Create products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  cost_price numeric,
  sku text,
  image_url text,
  track_stock boolean NOT NULL DEFAULT false,
  stock_quantity integer NOT NULL DEFAULT 0,
  min_stock_alert integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_products_shop_id ON public.products(shop_id);
CREATE INDEX idx_products_sku ON public.products(shop_id, sku) WHERE sku IS NOT NULL;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Shop owners can manage their products (CRUD)
CREATE POLICY "Shop owners can manage their products"
  ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.owner_id = auth.uid()
  ));

-- Policy: Anyone can view products of active shops (for future storefront)
CREATE POLICY "Anyone can view products of active shops"
  ON public.products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM shops WHERE shops.id = products.shop_id AND shops.is_active = true
  ));

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();