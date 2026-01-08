-- Add tax_id column to shops table for CPF/CNPJ
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS tax_id text;