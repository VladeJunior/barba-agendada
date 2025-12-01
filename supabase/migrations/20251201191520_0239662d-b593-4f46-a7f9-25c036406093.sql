-- Create loyalty points table
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, client_phone)
);

-- Create loyalty rewards table
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  discount_percentage NUMERIC,
  discount_amount NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT check_discount CHECK (
    (discount_percentage IS NOT NULL AND discount_amount IS NULL) OR
    (discount_percentage IS NULL AND discount_amount IS NOT NULL)
  )
);

-- Create loyalty coupons table
CREATE TABLE public.loyalty_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_percentage NUMERIC,
  discount_amount NUMERIC,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, code),
  CONSTRAINT check_coupon_discount CHECK (
    (discount_percentage IS NOT NULL AND discount_amount IS NULL) OR
    (discount_percentage IS NULL AND discount_amount IS NOT NULL)
  )
);

-- Create points transactions table
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE SET NULL,
  points_change INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for loyalty_points
CREATE POLICY "Anyone can view points by phone"
ON public.loyalty_points FOR SELECT
USING (true);

CREATE POLICY "Shop owners can manage loyalty points"
ON public.loyalty_points FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = loyalty_points.shop_id
    AND shops.owner_id = auth.uid()
  )
);

-- Policies for loyalty_rewards
CREATE POLICY "Anyone can view active rewards"
ON public.loyalty_rewards FOR SELECT
USING (is_active = true);

CREATE POLICY "Shop owners can manage rewards"
ON public.loyalty_rewards FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = loyalty_rewards.shop_id
    AND shops.owner_id = auth.uid()
  )
);

-- Policies for loyalty_coupons
CREATE POLICY "Anyone can view active coupons by code"
ON public.loyalty_coupons FOR SELECT
USING (is_active = true);

CREATE POLICY "Shop owners can manage coupons"
ON public.loyalty_coupons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = loyalty_coupons.shop_id
    AND shops.owner_id = auth.uid()
  )
);

-- Policies for loyalty_transactions
CREATE POLICY "Anyone can view transactions by phone"
ON public.loyalty_transactions FOR SELECT
USING (true);

CREATE POLICY "Shop owners can view transactions"
ON public.loyalty_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = loyalty_transactions.shop_id
    AND shops.owner_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_loyalty_points_shop_phone ON public.loyalty_points(shop_id, client_phone);
CREATE INDEX idx_loyalty_rewards_shop ON public.loyalty_rewards(shop_id);
CREATE INDEX idx_loyalty_coupons_shop_code ON public.loyalty_coupons(shop_id, code);
CREATE INDEX idx_loyalty_transactions_client ON public.loyalty_transactions(shop_id, client_phone);

-- Create trigger to update updated_at
CREATE TRIGGER update_loyalty_points_updated_at
BEFORE UPDATE ON public.loyalty_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_rewards_updated_at
BEFORE UPDATE ON public.loyalty_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_coupons_updated_at
BEFORE UPDATE ON public.loyalty_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();