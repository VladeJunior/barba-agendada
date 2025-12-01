-- Add points expiration configuration to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS loyalty_points_expiration_months integer DEFAULT 12;

COMMENT ON COLUMN public.shops.loyalty_points_expiration_months IS 'Number of months until loyalty points expire (NULL = never expire)';

-- Add expiration tracking to loyalty_points table
ALTER TABLE public.loyalty_points 
ADD COLUMN IF NOT EXISTS points_expire_at timestamp with time zone;

COMMENT ON COLUMN public.loyalty_points.points_expire_at IS 'When the current points will expire';

-- Create function to update points expiration date
CREATE OR REPLACE FUNCTION update_loyalty_points_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update expiration if shop has expiration configured
  IF NEW.total_points > 0 THEN
    SELECT 
      CASE 
        WHEN s.loyalty_points_expiration_months IS NOT NULL 
        THEN NOW() + (s.loyalty_points_expiration_months || ' months')::interval
        ELSE NULL
      END INTO NEW.points_expire_at
    FROM shops s
    WHERE s.id = NEW.shop_id;
  ELSE
    NEW.points_expire_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update expiration date
DROP TRIGGER IF EXISTS trigger_update_loyalty_points_expiration ON public.loyalty_points;
CREATE TRIGGER trigger_update_loyalty_points_expiration
  BEFORE INSERT OR UPDATE OF total_points
  ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_points_expiration();