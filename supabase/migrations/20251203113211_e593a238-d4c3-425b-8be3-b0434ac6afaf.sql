-- Create table to track billing reminders sent
CREATE TABLE public.billing_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- 'before_5_days', 'before_2_days', 'expiration_day', 'grace_1_day', 'grace_2_day', 'grace_3_day'
  period_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_reminder UNIQUE (shop_id, reminder_type, period_ends_at)
);

-- Enable RLS
ALTER TABLE public.billing_reminders ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (via edge functions)
CREATE POLICY "Service role can manage billing reminders"
ON public.billing_reminders
FOR ALL
USING (false)
WITH CHECK (false);