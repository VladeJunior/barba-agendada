-- Create table to track sent reminders
CREATE TABLE public.appointment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  UNIQUE(appointment_id, reminder_type)
);

-- Enable RLS
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Shop owners can view reminders for their appointments
CREATE POLICY "Shop owners can view reminders"
ON public.appointment_reminders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.shops s ON s.id = a.shop_id
    WHERE a.id = appointment_reminders.appointment_id
    AND s.owner_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_appointment_reminders_appointment_id ON public.appointment_reminders(appointment_id);