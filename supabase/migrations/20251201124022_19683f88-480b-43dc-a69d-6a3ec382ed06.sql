-- Create barber_invitations table to track pending invitations
CREATE TABLE public.barber_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.barber_invitations ENABLE ROW LEVEL SECURITY;

-- Shop owners can manage invitations
CREATE POLICY "Shop owners can manage invitations"
ON public.barber_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = barber_invitations.shop_id
      AND shops.owner_id = auth.uid()
  )
);

-- Anyone can view invitation by token (for accepting)
CREATE POLICY "Anyone can view invitation by token"
ON public.barber_invitations
FOR SELECT
USING (true);

-- Create index for token lookup
CREATE INDEX idx_barber_invitations_token ON public.barber_invitations(token);
CREATE INDEX idx_barber_invitations_email ON public.barber_invitations(email);