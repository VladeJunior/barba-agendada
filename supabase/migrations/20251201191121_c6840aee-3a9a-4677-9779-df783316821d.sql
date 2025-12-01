-- Create barber portfolio images table
CREATE TABLE public.barber_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.barber_portfolio ENABLE ROW LEVEL SECURITY;

-- Anyone can view portfolio images
CREATE POLICY "Anyone can view portfolio images"
ON public.barber_portfolio
FOR SELECT
USING (true);

-- Shop owners can manage their barbers' portfolios
CREATE POLICY "Shop owners can manage barber portfolios"
ON public.barber_portfolio
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    JOIN public.shops ON shops.id = barbers.shop_id
    WHERE barbers.id = barber_portfolio.barber_id
    AND shops.owner_id = auth.uid()
  )
);

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('barber-portfolio', 'barber-portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio images
CREATE POLICY "Public can view portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'barber-portfolio');

CREATE POLICY "Shop owners can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'barber-portfolio'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Shop owners can update portfolio images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'barber-portfolio');

CREATE POLICY "Shop owners can delete portfolio images"
ON storage.objects FOR DELETE
USING (bucket_id = 'barber-portfolio');

-- Create index for better performance
CREATE INDEX idx_barber_portfolio_barber_id ON public.barber_portfolio(barber_id);