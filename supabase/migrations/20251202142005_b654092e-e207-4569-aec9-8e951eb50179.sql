-- Add columns to appointments table for coupon tracking
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.loyalty_coupons(id),
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS final_price numeric;

-- Create secure function to increment coupon usage (bypasses RLS)
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE loyalty_coupons 
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = coupon_uuid 
    AND is_active = true
    AND (max_uses IS NULL OR current_uses < max_uses);
END;
$$;