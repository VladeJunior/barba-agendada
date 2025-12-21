-- Tabela de relacionamento barbeiros ↔ serviços
CREATE TABLE public.barber_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(barber_id, service_id)
);

-- Habilitar RLS
ALTER TABLE public.barber_services ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ver serviços de barbeiros de lojas ativas
CREATE POLICY "Anyone can view barber services of active shops"
  ON public.barber_services FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.barbers b 
    JOIN public.shops s ON s.id = b.shop_id 
    WHERE b.id = barber_services.barber_id AND s.is_active = true
  ));

-- Política: Donos de lojas podem gerenciar serviços dos barbeiros
CREATE POLICY "Shop owners can manage barber services"
  ON public.barber_services FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.barbers b 
    JOIN public.shops s ON s.id = b.shop_id 
    WHERE b.id = barber_services.barber_id AND s.owner_id = auth.uid()
  ));