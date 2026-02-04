-- Tabela de movimentação de estoque
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment')),
  quantity integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  reason text,
  reference_id uuid, -- ID da venda ou outro registro relacionado
  reference_type text, -- 'product_sale', 'manual', etc.
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_stock_movements_shop_id ON public.stock_movements(shop_id);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(movement_type);

-- RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can manage stock movements"
  ON public.stock_movements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM shops WHERE shops.id = stock_movements.shop_id 
    AND shops.owner_id = auth.uid()
  ));

CREATE POLICY "Shop owners can insert stock movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM shops WHERE shops.id = stock_movements.shop_id 
    AND shops.owner_id = auth.uid()
  ));

-- Atualizar função de decremento para também registrar movimentação
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER AS $$
DECLARE
  current_stock integer;
  new_stock integer;
BEGIN
  -- Buscar estoque atual
  SELECT stock_quantity INTO current_stock
  FROM products 
  WHERE id = NEW.product_id;
  
  -- Calcular novo estoque
  new_stock := GREATEST(0, current_stock - NEW.quantity);
  
  -- Atualizar estoque
  UPDATE products 
  SET stock_quantity = new_stock,
      updated_at = now()
  WHERE id = NEW.product_id 
    AND track_stock = true;
  
  -- Registrar movimentação de saída
  INSERT INTO stock_movements (
    shop_id,
    product_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    reason,
    reference_id,
    reference_type
  ) VALUES (
    NEW.shop_id,
    NEW.product_id,
    'exit',
    NEW.quantity,
    current_stock,
    new_stock,
    'Venda de produto',
    NEW.id,
    'product_sale'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;