-- Add RLS policy for barbers to view their own appointments
CREATE POLICY "Barbers can view their own appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = appointments.barber_id
      AND barbers.user_id = auth.uid()
      AND barbers.is_active = true
  )
);

-- Add RLS policy for barbers to update their own appointments (status only)
CREATE POLICY "Barbers can update their own appointments"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.barbers
    WHERE barbers.id = appointments.barber_id
      AND barbers.user_id = auth.uid()
      AND barbers.is_active = true
  )
);