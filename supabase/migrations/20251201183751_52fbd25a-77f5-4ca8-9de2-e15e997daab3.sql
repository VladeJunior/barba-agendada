-- Insert super_admin role for contato@infobarber.com.br
INSERT INTO public.user_roles (user_id, role, shop_id)
VALUES ('05f40864-6d63-49fa-b8cc-68a94cb5fb6a', 'super_admin', NULL)
ON CONFLICT DO NOTHING;

-- RLS Policies for Super Admin

-- Shops: Super admin can view all shops (including inactive)
CREATE POLICY "Super admin can view all shops"
ON public.shops
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Shops: Super admin can update all shops
CREATE POLICY "Super admin can update all shops"
ON public.shops
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Appointments: Super admin can view all appointments
CREATE POLICY "Super admin can view all appointments"
ON public.appointments
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Barbers: Super admin can view all barbers
CREATE POLICY "Super admin can view all barbers"
ON public.barbers
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Services: Super admin can view all services
CREATE POLICY "Super admin can view all services"
ON public.services
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));