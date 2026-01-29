-- Create table to track subscription coupon uses
CREATE TABLE public.subscription_coupon_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  coupon_code text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now(),
  billing_id text,
  UNIQUE(shop_id, coupon_code)
);

-- Enable RLS
ALTER TABLE public.subscription_coupon_uses ENABLE ROW LEVEL SECURITY;

-- Only service role can manage this table (edge functions use service role)
CREATE POLICY "Service role can manage coupon uses"
  ON public.subscription_coupon_uses FOR ALL
  USING (false) WITH CHECK (false);