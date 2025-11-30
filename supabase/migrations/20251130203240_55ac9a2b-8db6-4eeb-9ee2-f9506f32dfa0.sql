-- Allow anyone to view appointments by phone number (for client lookup)
CREATE POLICY "Anyone can view appointments by phone"
ON public.appointments
FOR SELECT
USING (client_phone IS NOT NULL);

-- Allow anyone to cancel appointments by phone (client self-service)
CREATE POLICY "Anyone can cancel appointments"
ON public.appointments
FOR UPDATE
USING (client_phone IS NOT NULL)
WITH CHECK (status = 'cancelled');