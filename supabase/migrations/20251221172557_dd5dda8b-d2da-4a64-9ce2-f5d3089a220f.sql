-- Create commission_payments table
CREATE TABLE public.commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL,
  barber_id uuid NOT NULL,
  
  -- Período da comissão
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  
  -- Valores
  total_revenue numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL DEFAULT 0,
  
  -- Status do pagamento
  status text NOT NULL DEFAULT 'pending',
  amount_paid numeric NOT NULL DEFAULT 0,
  
  -- Metadados
  paid_at timestamp with time zone,
  payment_method text,
  notes text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

-- Shop owners can manage commission payments
CREATE POLICY "Shop owners can manage commission payments"
ON public.commission_payments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM shops
  WHERE shops.id = commission_payments.shop_id
  AND shops.owner_id = auth.uid()
));

-- Barbers can view their own commission payments
CREATE POLICY "Barbers can view their own commission payments"
ON public.commission_payments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM barbers
  WHERE barbers.id = commission_payments.barber_id
  AND barbers.user_id = auth.uid()
  AND barbers.is_active = true
));

-- Create trigger for updated_at
CREATE TRIGGER update_commission_payments_updated_at
BEFORE UPDATE ON public.commission_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();