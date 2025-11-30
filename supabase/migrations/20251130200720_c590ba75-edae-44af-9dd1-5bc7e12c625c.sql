-- Create enums for appointment and payment status
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'refunded');

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create barbers table
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create working_hours table
CREATE TABLE public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (barber_id, day_of_week)
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  client_name TEXT,
  client_phone TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Services RLS policies
CREATE POLICY "Anyone can view services of active shops"
ON public.services FOR SELECT
USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = services.shop_id AND shops.is_active = true));

CREATE POLICY "Shop owners can manage their services"
ON public.services FOR ALL
USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = services.shop_id AND shops.owner_id = auth.uid()));

-- Barbers RLS policies
CREATE POLICY "Anyone can view barbers of active shops"
ON public.barbers FOR SELECT
USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = barbers.shop_id AND shops.is_active = true));

CREATE POLICY "Shop owners can manage their barbers"
ON public.barbers FOR ALL
USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = barbers.shop_id AND shops.owner_id = auth.uid()));

-- Working hours RLS policies
CREATE POLICY "Anyone can view working hours of active shops"
ON public.working_hours FOR SELECT
USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = working_hours.shop_id AND shops.is_active = true));

CREATE POLICY "Shop owners can manage working hours"
ON public.working_hours FOR ALL
USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = working_hours.shop_id AND shops.owner_id = auth.uid()));

-- Appointments RLS policies
CREATE POLICY "Shop owners can view all appointments"
ON public.appointments FOR SELECT
USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = appointments.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Shop owners can manage appointments"
ON public.appointments FOR ALL
USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = appointments.shop_id AND shops.owner_id = auth.uid()));

CREATE POLICY "Clients can view their own appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = client_id OR client_id IS NULL);

-- Create indexes for better performance
CREATE INDEX idx_services_shop_id ON public.services(shop_id);
CREATE INDEX idx_barbers_shop_id ON public.barbers(shop_id);
CREATE INDEX idx_working_hours_barber_id ON public.working_hours(barber_id);
CREATE INDEX idx_appointments_shop_id ON public.appointments(shop_id);
CREATE INDEX idx_appointments_barber_id ON public.appointments(barber_id);
CREATE INDEX idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);

-- Add triggers for updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_barbers_updated_at
BEFORE UPDATE ON public.barbers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();