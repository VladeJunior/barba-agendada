-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'barber', 'client');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shops (barbearias) table
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  logo_url TEXT,
  cover_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, shop_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role, _shop_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (shop_id = _shop_id OR _shop_id IS NULL)
  )
$$;

-- Function to get user's shop_id
CREATE OR REPLACE FUNCTION public.get_user_shop_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT shop_id FROM public.user_roles WHERE user_id = _user_id AND role = 'owner' LIMIT 1
$$;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Shops RLS Policies
CREATE POLICY "Anyone can view active shops"
  ON public.shops FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can view their own shops"
  ON public.shops FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own shops"
  ON public.shops FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own shops"
  ON public.shops FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own shops"
  ON public.shops FOR DELETE
  USING (auth.uid() = owner_id);

-- User Roles RLS Policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Shop owners can view roles in their shop"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = user_roles.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shop owners can manage roles in their shop"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = user_roles.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Function to handle new user signup (creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX idx_shops_slug ON public.shops(slug);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_shop_id ON public.user_roles(shop_id);