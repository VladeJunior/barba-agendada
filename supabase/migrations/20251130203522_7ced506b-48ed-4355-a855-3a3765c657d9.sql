-- Table for blocked time slots (breaks, days off, etc.)
CREATE TABLE public.blocked_times (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;

-- Shop owners can manage blocked times
CREATE POLICY "Shop owners can manage blocked times"
ON public.blocked_times
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.shops
  WHERE shops.id = blocked_times.shop_id
  AND shops.owner_id = auth.uid()
));

-- Anyone can view blocked times for scheduling
CREATE POLICY "Anyone can view blocked times"
ON public.blocked_times
FOR SELECT
USING (TRUE);

-- Index for faster queries
CREATE INDEX idx_blocked_times_barber_date ON public.blocked_times(barber_id, start_time);