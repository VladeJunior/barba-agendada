-- Create barber reviews table
CREATE TABLE public.barber_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_phone TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Enable RLS
ALTER TABLE public.barber_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews (public for booking page)
CREATE POLICY "Anyone can view reviews"
ON public.barber_reviews
FOR SELECT
USING (true);

-- Clients can create reviews for their own completed appointments
CREATE POLICY "Clients can create reviews for their appointments"
ON public.barber_reviews
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.id = appointment_id
    AND appointments.status = 'completed'
    AND (
      (appointments.client_id = auth.uid())
      OR (appointments.client_phone = client_phone AND client_phone IS NOT NULL)
    )
  )
);

-- Shop owners can view reviews for their barbers
CREATE POLICY "Shop owners can view their barbers reviews"
ON public.barber_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    JOIN public.shops ON shops.id = barbers.shop_id
    WHERE barbers.id = barber_reviews.barber_id
    AND shops.owner_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_barber_reviews_barber_id ON public.barber_reviews(barber_id);
CREATE INDEX idx_barber_reviews_appointment_id ON public.barber_reviews(appointment_id);