-- Add tax id (CPF/CNPJ) to profiles for billing
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tax_id text;